import type { contract } from "@codesphere/contract";
import { auditLog } from "@codesphere/db/schema/audit";
import { user } from "@codesphere/db/schema/auth";
import { hackathon } from "@codesphere/db/schema/hackathons";
import type { RouterContractClient } from "@orpc/contract";
import { ORPCError } from "@orpc/server";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";

import { withAudit } from "../audit";
import { requireAdmin } from "../authorization";
import { decodeCursor, encodeCursor } from "../cursor";
import { unexpectedErrors } from "../errors";
import { loadHackathons } from "../hackathons";
import { impl } from "../index";
import { ownProfile, publicProfile } from "../profile";
import { createQuestionsHandlers } from "../questions/handlers";
import { createQuestionService, QuestionError } from "../questions/service";

// The authorization guard behind every admin procedure (spec §2). Throws the typed
// UNAUTHORIZED / FORBIDDEN error declared on the admin contract.
const isAdmin = impl.middleware(async ({ context, next }) => {
	const result = requireAdmin(context.session);
	if (!result.ok) {
		throw new ORPCError(result.code);
	}
	return next();
});

export const appRouter = impl.use(unexpectedErrors).router({
	health: {
		check: impl.health.check.handler(({ context }) => ({
			status: "ok" as const,
			...context.release,
		})),
		ready: impl.health.ready.handler(async ({ context, errors }) => {
			try {
				await context.db.execute(sql`select 1`);
			} catch (error) {
				context.logger.warn({ err: error }, "database not reachable");
				throw errors.SERVICE_UNAVAILABLE();
			}
			return { status: "ready" as const };
		}),
	},
	members: {
		me: impl.members.me.handler(async ({ context, errors }) => {
			const userId = context.session?.user.id;
			if (!userId) {
				throw errors.UNAUTHORIZED();
			}
			const [row] = await context.db
				.select()
				.from(user)
				.where(eq(user.id, userId));
			if (!row) {
				throw errors.UNAUTHORIZED();
			}
			return ownProfile(row);
		}),
		update: impl.members.update.handler(async ({ context, input, errors }) => {
			const userId = context.session?.user.id;
			if (!userId) {
				throw errors.UNAUTHORIZED();
			}
			const [row] = await context.db
				.update(user)
				.set(input)
				.where(eq(user.id, userId))
				.returning();
			if (!row) {
				throw errors.UNAUTHORIZED();
			}
			return ownProfile(row);
		}),
		get: impl.members.get.handler(async ({ context, input, errors }) => {
			const [row] = await context.db
				.select()
				.from(user)
				.where(eq(user.id, input.id));
			if (!row) {
				throw errors.NOT_FOUND();
			}
			return publicProfile(row);
		}),
	},
	hackathons: {
		list: impl.hackathons.list.handler(async ({ context, input }) => ({
			items: await loadHackathons(context.db, undefined, input.limit),
			nextCursor: null,
		})),
		get: impl.hackathons.get.handler(async ({ context, input, errors }) => {
			const [found] = await loadHackathons(context.db, { slug: input.slug }, 1);
			if (!found) {
				throw errors.NOT_FOUND();
			}
			return found;
		}),
	},
	admin: {
		auditLog: {
			list: impl.admin.auditLog.list
				.use(isAdmin)
				.handler(async ({ context, input, errors }) => {
					const position = input.cursor ? decodeCursor(input.cursor) : null;
					if (input.cursor && !position) {
						throw errors.BAD_REQUEST({
							data: {
								issues: [{ path: ["cursor"], message: "Invalid cursor" }],
							},
						});
					}
					const rows = await context.db
						.select()
						.from(auditLog)
						.where(
							and(
								input.action ? eq(auditLog.action, input.action) : undefined,
								input.actorId ? eq(auditLog.actorId, input.actorId) : undefined,
								input.targetType
									? eq(auditLog.targetType, input.targetType)
									: undefined,
								position
									? or(
											lt(auditLog.createdAt, position.createdAt),
											and(
												eq(auditLog.createdAt, position.createdAt),
												lt(auditLog.id, position.id),
											),
										)
									: undefined,
							),
						)
						.orderBy(desc(auditLog.createdAt), desc(auditLog.id))
						.limit(input.limit + 1);
					const page = rows.slice(0, input.limit);
					const last = page.at(-1);
					return {
						items: page.map((row) => ({
							id: row.id,
							actorId: row.actorId,
							action: row.action,
							targetType: row.targetType,
							targetId: row.targetId,
							details: row.details ?? null,
							createdAt: row.createdAt.toISOString(),
						})),
						nextCursor:
							rows.length > input.limit && last
								? encodeCursor(last.createdAt, last.id)
								: null,
					};
				}),
		},
		hackathons: {
			update: impl.admin.hackathons.update
				.use(isAdmin)
				.handler(async ({ context, input, errors }) => {
					const actorId = context.session?.user.id;
					if (!actorId) {
						throw errors.UNAUTHORIZED();
					}
					const { slug, expectedVersion, verifiedAt, ...fields } = input;
					const [current] = await loadHackathons(context.db, { slug }, 1);
					if (!current) {
						throw errors.NOT_FOUND();
					}
					const teamMin = fields.teamMin ?? current.teamMin;
					const teamMax = fields.teamMax ?? current.teamMax;
					if (teamMin > teamMax) {
						throw errors.BAD_REQUEST({
							data: {
								issues: [
									{
										path: ["teamMax"],
										message: "teamMax must be at least teamMin",
									},
								],
							},
						});
					}
					const changes = {
						...fields,
						...(verifiedAt ? { verifiedAt: new Date(verifiedAt) } : {}),
					};
					// One statement: the edit and its audit event land together, or not at all (#122).
					const rows = await withAudit(
						context.db,
						{
							actorId,
							action: "hackathon.update",
							targetType: "hackathon",
							targetIdColumn: "slug",
							details: { fields: Object.keys(changes) },
						},
						context.db
							.update(hackathon)
							.set({ ...changes, version: expectedVersion + 1 })
							.where(
								and(
									eq(hackathon.slug, slug),
									eq(hackathon.version, expectedVersion),
								),
							)
							.returning({ slug: hackathon.slug }),
					);
					if (rows.length === 0) {
						const [latest] = await loadHackathons(context.db, { slug }, 1);
						throw errors.CONFLICT({
							data: { version: latest?.version ?? current.version },
						});
					}
					const [updated] = await loadHackathons(context.db, { slug }, 1);
					if (!updated) {
						throw errors.NOT_FOUND();
					}
					return updated;
				}),
		},
		questions: {
			remove: impl.admin.questions.remove
				.use(isAdmin)
				.handler(async ({ context, input, errors }) => {
					const actorId = context.session?.user.id;
					if (!actorId) {
						throw errors.UNAUTHORIZED();
					}
					try {
						// The isAdmin middleware admits staff only, so the actor is staff here.
						return await createQuestionService(context.db).removeQuestion(
							{ id: actorId, isStaff: true },
							input.id,
							input.expectedVersion,
						);
					} catch (err) {
						if (err instanceof QuestionError) {
							if (err.code === "NOT_FOUND") throw errors.NOT_FOUND();
							if (err.code === "FORBIDDEN") throw errors.FORBIDDEN();
							if (err.code === "CONFLICT") {
								throw errors.CONFLICT({
									data: { version: err.currentVersion ?? 0 },
								});
							}
						}
						throw err;
					}
				}),
		},
	},
	questions: createQuestionsHandlers(),
});

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterContractClient<typeof contract>;
