import type {
	CreateQuestionInput,
	UpdateQuestionInput,
} from "@codesphere/contract/questions";
import type { Database } from "@codesphere/db";
import { idempotencyKeys, questions } from "@codesphere/db/schema/questions";
import { and, eq, isNull } from "drizzle-orm";
import { sanitizeMarkdown } from "../markdown/sanitizer";

export function createQuestionService(db: Database) {
	return {
		async createQuestion(authorId: string, input: CreateQuestionInput) {
			if (input.tags.length < 1 || input.tags.length > 5) {
				throw new Error("VALIDATION_ERROR: Tags must be 1–5");
			}

			const [existing] = await db
				.select({ questionId: idempotencyKeys.questionId })
				.from(idempotencyKeys)
				.where(eq(idempotencyKeys.id, input.idempotencyKey))
				.limit(1);

			if (existing) {
				const [q] = await db
					.select()
					.from(questions)
					.where(eq(questions.id, existing.questionId));
				return toDTO(q);
			}

			const { html: bodyHtml } = sanitizeMarkdown(input.body);

			const [q] = await db
				.insert(questions)
				.values({
					authorId,
					title: input.title,
					body: input.body,
					bodyHtml,
					language: input.language,
					tags: input.tags,
					status: "open",
					version: 1,
				})
				.returning();

			await db.insert(idempotencyKeys).values({
				id: input.idempotencyKey,
				questionId: q!.id,
			});

			return toDTO(q);
		},

		async getQuestion(id: string) {
			const [q] = await db
				.select()
				.from(questions)
				.where(and(eq(questions.id, id), isNull(questions.deletedAt)))
				.limit(1);

			if (!q) {
				throw new Error("NOT_FOUND");
			}

			return toDTO(q);
		},

		async updateQuestion(authorId: string, input: UpdateQuestionInput) {
			const [q] = await db
				.select()
				.from(questions)
				.where(and(eq(questions.id, input.id), isNull(questions.deletedAt)))
				.limit(1);

			if (!q) {
				throw new Error("NOT_FOUND");
			}

			if (q.authorId !== authorId) {
				throw new Error("UNAUTHORIZED");
			}

			if (q.version !== input.expectedVersion) {
				throw new Error(
					`CONFLICT: expected version ${input.expectedVersion}, got ${q.version}`,
				);
			}

			if (input.tags && (input.tags.length < 1 || input.tags.length > 5)) {
				throw new Error("VALIDATION_ERROR: Tags must be 1–5");
			}

			const body = input.body ?? q.body;
			const { html: bodyHtml } = sanitizeMarkdown(body);

			const [updated] = await db
				.update(questions)
				.set({
					title: input.title ?? q.title,
					body,
					bodyHtml,
					language: input.language ?? q.language,
					tags: input.tags ?? q.tags,
					version: q.version + 1,
					updatedAt: new Date(),
				})
				.where(eq(questions.id, input.id))
				.returning();

			return toDTO(updated);
		},

		async closeQuestion(_userId: string, id: string, expectedVersion: number) {
			const [q] = await db
				.select()
				.from(questions)
				.where(and(eq(questions.id, id), isNull(questions.deletedAt)))
				.limit(1);

			if (!q) {
				throw new Error("NOT_FOUND");
			}

			if (q.version !== expectedVersion) {
				throw new Error(
					`CONFLICT: expected version ${expectedVersion}, got ${q.version}`,
				);
			}

			const [updated] = await db
				.update(questions)
				.set({
					status: "closed",
					version: q.version + 1,
					updatedAt: new Date(),
				})
				.where(eq(questions.id, id))
				.returning();

			return toDTO(updated);
		},

		async softDeleteQuestion(
			authorId: string,
			id: string,
			expectedVersion: number,
		) {
			const [q] = await db
				.select()
				.from(questions)
				.where(and(eq(questions.id, id), isNull(questions.deletedAt)))
				.limit(1);

			if (!q) {
				throw new Error("NOT_FOUND");
			}

			if (q.authorId !== authorId) {
				throw new Error("UNAUTHORIZED");
			}

			if (q.version !== expectedVersion) {
				throw new Error(
					`CONFLICT: expected version ${expectedVersion}, got ${q.version}`,
				);
			}

			await db
				.update(questions)
				.set({
					deletedAt: new Date(),
					version: q.version + 1,
				})
				.where(eq(questions.id, id));

			return { success: true };
		},
	};
}

function toDTO(row: any) {
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

export type QuestionsService = ReturnType<typeof createQuestionService>;
