import type {
	CreateQuestionInput,
	UpdateQuestionInput,
} from "@codesphere/contract/questions";
import type { Database } from "@codesphere/db";
import { questions } from "@codesphere/db/schema/questions";
import { and, eq, isNull } from "drizzle-orm";
import { withAudit } from "../audit";
import { sanitizeMarkdown } from "../markdown/sanitizer";
import { ensureTags } from "../tags";

/** A refused question operation. `currentVersion` is set on CONFLICT only. */
export class QuestionError extends Error {
	constructor(
		readonly code: "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "VALIDATION",
		readonly currentVersion?: number,
	) {
		super(code);
	}
}

/** `isStaff`: an admin, a super admin or a moderator (see requireAdmin). */
export type Actor = { id: string; isStaff: boolean };

const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(err: unknown) {
	const code =
		(err as { code?: string }).code ??
		(err as { cause?: { code?: string } }).cause?.code;
	return code === UNIQUE_VIOLATION;
}

export function createQuestionService(db: Database) {
	async function findLive(id: string) {
		const [q] = await db
			.select()
			.from(questions)
			.where(and(eq(questions.id, id), isNull(questions.deletedAt)))
			.limit(1);
		if (!q) {
			throw new QuestionError("NOT_FOUND");
		}
		return q;
	}

	// Compare-and-set on `version`: the write lands only if nobody changed the question since the
	// client read it. Otherwise the question is re-read to report the version that won.
	async function writeIfVersion(
		id: string,
		expectedVersion: number,
		changes: Partial<typeof questions.$inferInsert>,
	) {
		const [updated] = await db
			.update(questions)
			.set({ ...changes, version: expectedVersion + 1, updatedAt: new Date() })
			.where(
				and(
					eq(questions.id, id),
					eq(questions.version, expectedVersion),
					isNull(questions.deletedAt),
				),
			)
			.returning();
		if (updated) {
			return updated;
		}
		const current = await findLive(id);
		throw new QuestionError("CONFLICT", current.version);
	}

	// A moderation write: the change and its audit event land in one statement, or not at all.
	// Like writeIfVersion it is a compare-and-set on `version`; on no row, the question is re-read to
	// tell NOT_FOUND from CONFLICT.
	async function moderate(
		actor: Actor,
		id: string,
		expectedVersion: number,
		action: string,
		changes: Partial<typeof questions.$inferInsert>,
	) {
		const rows = await withAudit(
			db,
			{
				actorId: actor.id,
				action,
				targetType: "question",
				targetIdColumn: "id",
				details: { fields: Object.keys(changes) },
			},
			db
				.update(questions)
				.set({
					...changes,
					version: expectedVersion + 1,
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(questions.id, id),
						eq(questions.version, expectedVersion),
						isNull(questions.deletedAt),
					),
				)
				.returning({ id: questions.id }),
		);
		if (rows.length === 0) {
			const current = await findLive(id);
			throw new QuestionError("CONFLICT", current.version);
		}
	}

	return {
		async createQuestion(authorId: string, input: CreateQuestionInput) {
			if (input.tags.length < 1 || input.tags.length > 5) {
				throw new QuestionError("VALIDATION");
			}

			const { html: bodyHtml } = sanitizeMarkdown(input.body);

			// Tags are created freely, normalized: each becomes an official Tag row (#44).
			await ensureTags(db, input.tags);

			// One statement, no transaction: a racing duplicate key fails on the unique index and
			// nothing is written. The replay then returns the question the first request created.
			try {
				const [q] = await db
					.insert(questions)
					.values({
						authorId,
						idempotencyKey: input.idempotencyKey,
						title: input.title,
						body: input.body,
						bodyHtml,
						language: input.language,
						tags: input.tags,
						status: "open",
						version: 1,
					})
					.returning();
				if (!q) {
					throw new Error("INSERT returned no row");
				}
				return toDTO(q);
			} catch (err) {
				if (!isUniqueViolation(err)) {
					throw err;
				}
				const [existing] = await db
					.select()
					.from(questions)
					.where(
						and(
							eq(questions.authorId, authorId),
							eq(questions.idempotencyKey, input.idempotencyKey),
						),
					)
					.limit(1);
				if (!existing) {
					throw err;
				}
				return toDTO(existing);
			}
		},

		async getQuestion(id: string) {
			return toDTO(await findLive(id));
		},

		async updateQuestion(actorId: string, input: UpdateQuestionInput) {
			const q = await findLive(input.id);
			if (q.authorId !== actorId) {
				throw new QuestionError("FORBIDDEN");
			}

			if (input.tags && (input.tags.length < 1 || input.tags.length > 5)) {
				throw new QuestionError("VALIDATION");
			}

			if (input.tags) {
				await ensureTags(db, input.tags);
			}

			const body = input.body ?? q.body;
			const updated = await writeIfVersion(input.id, input.expectedVersion, {
				title: input.title ?? q.title,
				body,
				bodyHtml: sanitizeMarkdown(body).html,
				language: input.language ?? q.language,
				tags: input.tags ?? q.tags,
			});
			return toDTO(updated);
		},

		/**
		 * Closed by its author or by staff, and by no one else. Staff closing someone else's question
		 * is a moderation action: it is audited in the same statement as the change (#122).
		 */
		async closeQuestion(actor: Actor, id: string, expectedVersion: number) {
			const q = await findLive(id);
			if (!actor.isStaff && q.authorId !== actor.id) {
				throw new QuestionError("FORBIDDEN");
			}
			if (q.authorId === actor.id) {
				const updated = await writeIfVersion(id, expectedVersion, {
					status: "closed",
				});
				return toDTO(updated);
			}
			await moderate(actor, id, expectedVersion, "question.close", {
				status: "closed",
			});
			return toDTO(await findLive(id));
		},

		/**
		 * Reopens a closed Question, by its author or by staff: answered again if it has an Accepted
		 * answer, open otherwise. Staff acting on someone else's Question is audited (#52).
		 */
		async reopenQuestion(actor: Actor, id: string, expectedVersion: number) {
			const q = await findLive(id);
			if (!actor.isStaff && q.authorId !== actor.id) {
				throw new QuestionError("FORBIDDEN");
			}
			if (q.status !== "closed") {
				throw new QuestionError("CONFLICT", q.version);
			}
			const status = q.acceptedAnswerId ? "answered" : "open";
			if (q.authorId === actor.id) {
				return toDTO(await writeIfVersion(id, expectedVersion, { status }));
			}
			await moderate(actor, id, expectedVersion, "question.reopen", {
				status,
			});
			return toDTO(await findLive(id));
		},

		/** Removed by staff, whoever wrote it. Audited like every moderation action (#122). */
		async removeQuestion(actor: Actor, id: string, expectedVersion: number) {
			if (!actor.isStaff) {
				throw new QuestionError("FORBIDDEN");
			}
			await moderate(actor, id, expectedVersion, "question.remove", {
				deletedAt: new Date(),
			});
			return { success: true };
		},

		async softDeleteQuestion(
			authorId: string,
			id: string,
			expectedVersion: number,
		) {
			const q = await findLive(id);
			if (q.authorId !== authorId) {
				throw new QuestionError("FORBIDDEN");
			}
			await writeIfVersion(id, expectedVersion, { deletedAt: new Date() });
			return { success: true };
		},
	};
}

export type QuestionsService = ReturnType<typeof createQuestionService>;

function toDTO(row: typeof questions.$inferSelect) {
	return {
		id: row.id,
		title: row.title,
		authorId: row.authorId,
		body: row.body,
		bodyHtml: row.bodyHtml,
		language: row.language,
		status: row.status,
		tags: row.tags,
		version: row.version,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}
