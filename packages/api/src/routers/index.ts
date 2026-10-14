import { type contract, MEMBER_SUSPENDED_MESSAGE } from "@codesphere/contract";
import { auditLog } from "@codesphere/db/schema/audit";
import { user } from "@codesphere/db/schema/auth";
import type { RouterContractClient } from "@orpc/contract";
import { ORPCError } from "@orpc/server";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";

import { createTag, deleteTag, listTags, renameTag } from "../admin-tags";
import { updateHackathon } from "../admin-hackathons";
import { listMembers, setSuspension } from "../admin-members";
import { requireAdmin } from "../authorization";
import { decodeCursor, encodeCursor } from "../cursor";
import { unexpectedErrors } from "../errors";
import { isRead } from "../exposure";
import { loadHackathons } from "../hackathons";
import { impl } from "../index";
import { ownProfile, publicProfile } from "../profile";
import {
	createFeedHandlers,
	createQuestionsHandlers,
} from "../questions/handlers";
import { createQuestionService, QuestionError } from "../questions/service";
import { isSuspended } from "../suspension";

// The authorization guard behind every admin procedure (spec §2). Throws the typed
// UNAUTHORIZED / FORBIDDEN error declared on the admin contract.
const isAdmin = impl.middleware(async ({ context, next }) => {
	const result = requireAdmin(context.session);
	if (!result.ok) {
		throw new ORPCError(result.code);
	}
	return next();
});

// The typed refusal of a moderation outcome (#123).
const refusal = (
	code: "NOT_FOUND" | "CONFLICT" | "FORBIDDEN",
	errors: {
		NOT_FOUND: () => Error;
		CONFLICT: () => Error;
		FORBIDDEN: (options?: { message?: string }) => Error;
	},
) =>
	code === "NOT_FOUND"
		? errors.NOT_FOUND()
		: code === "FORBIDDEN"
			? errors.FORBIDDEN({
					message: "You cannot moderate a Member of equal or higher rank.",
				})
			: errors.CONFLICT();

// A suspended Member keeps reading but every write is refused with a typed error (#123).
const refuseSuspendedWrites = impl.middleware(
	async ({ context, procedure, next }) => {
		if (isSuspended(context.session) && !isRead(procedure)) {
			throw new ORPCError("FORBIDDEN", { message: MEMBER_SUSPENDED_MESSAGE });
		}
		return next();
	},
);

export const appRouter = impl
	.use(unexpectedErrors)
	.use(refuseSuspendedWrites)
	.router({
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
			update: impl.members.update.handler(
				async ({ context, input, errors }) => {
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
				},
			),
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
				const [found] = await loadHackathons(
					context.db,
					{ slug: input.slug },
					1,
				);
				if (!found) {
					throw errors.NOT_FOUND();
				}
				return found;
			}),
		},
		admin: {
			hackathons: {
				update: impl.admin.hackathons.update
					.use(isAdmin)
					.handler(async ({ context, input, errors }) => {
						const outcome = await updateHackathon(
							context.db,
							context.session?.user.id ?? "",
							input,
						);
						if (outcome.ok) {
							return outcome.hackathon;
						}
						if (outcome.code === "BAD_REQUEST") {
							throw errors.BAD_REQUEST({
								data: {
									issues: [{ path: [outcome.path], message: outcome.message }],
								},
							});
						}
						if (outcome.code === "NOT_FOUND") {
							throw errors.NOT_FOUND();
						}
						throw errors.CONFLICT({ data: { version: outcome.version } });
					}),
			},
			members: {
				list: impl.admin.members.list
					.use(isAdmin)
					.handler(async ({ context, input, errors }) => {
						const page = await listMembers(context.db, input);
						if (!page) {
							throw errors.BAD_REQUEST({
								data: {
									issues: [{ path: ["cursor"], message: "Invalid cursor" }],
								},
							});
						}
						return page;
					}),
				suspend: impl.admin.members.suspend
					.use(isAdmin)
					.handler(async ({ context, input, errors }) => {
						const actorId = context.session?.user.id ?? "";
						if (input.id === actorId) {
							throw errors.FORBIDDEN({
								message: "An Admin cannot suspend themself.",
							});
						}
						const outcome = await setSuspension(
							context.db,
							actorId,
							String(context.session?.user.role),
							input.id,
							{ suspend: true, reason: input.reason },
						);
						if (!outcome.ok) {
							throw refusal(outcome.code, errors);
						}
						return outcome.member;
					}),
				reactivate: impl.admin.members.reactivate
					.use(isAdmin)
					.handler(async ({ context, input, errors }) => {
						const outcome = await setSuspension(
							context.db,
							context.session?.user.id ?? "",
							String(context.session?.user.role),
							input.id,
							{ suspend: false },
						);
						if (!outcome.ok) {
							throw refusal(outcome.code, errors);
						}
						return outcome.member;
					}),
			},
			tags: {
				list: impl.admin.tags.list
					.use(isAdmin)
					.handler(async ({ context }) => ({
						items: await listTags(context.db),
					})),
				create: impl.admin.tags.create
					.use(isAdmin)
					.handler(async ({ context, input, errors }) => {
						const outcome = await createTag(
							context.db,
							context.session?.user.id ?? "",
							input.name,
						);
						if (!outcome.ok) {
							throw errors.CONFLICT();
						}
						return outcome.tag;
					}),
				rename: impl.admin.tags.rename
					.use(isAdmin)
					.handler(async ({ context, input, errors }) => {
						const outcome = await renameTag(
							context.db,
							context.session?.user.id ?? "",
							input,
						);
						if (!outcome.ok) {
							throw outcome.code === "NOT_FOUND"
								? errors.NOT_FOUND()
								: errors.CONFLICT();
						}
						return outcome.tag;
					}),
				delete: impl.admin.tags.delete
					.use(isAdmin)
					.handler(async ({ context, input, errors }) => {
						const outcome = await deleteTag(
							context.db,
							context.session?.user.id ?? "",
							input.id,
						);
						if (!outcome.ok) {
							throw outcome.code === "NOT_FOUND"
								? errors.NOT_FOUND()
								: errors.CONFLICT();
						}
						return { success: true };
					}),
			},
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
									input.actorId
										? eq(auditLog.actorId, input.actorId)
										: undefined,
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
		feed: createFeedHandlers(),
	});

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterContractClient<typeof contract>;
