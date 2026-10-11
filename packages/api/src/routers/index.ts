import type { contract, Hackathon } from "@codesphere/contract";
import { auditLog } from "@codesphere/db/schema/audit";
import { user } from "@codesphere/db/schema/auth";
import type { RouterContractClient } from "@orpc/contract";
import { ORPCError } from "@orpc/server";
import { desc, eq } from "drizzle-orm";
import type * as z from "zod";

import { requireAdmin } from "../authorization";
import { impl } from "../index";
import { ownProfile, publicProfile } from "../profile";

// Spike data: the real CADEV entry will come from the seed script.
const cadev: z.infer<typeof Hackathon> = {
	slug: "cadev-2026",
	name: "Coupe d'Afrique des Développeurs 2026",
	organizer: "Systalink",
	summary:
		"Concours en ligne pour équipes de développeurs de l'Afrique francophone.",
	teamMin: 2,
	teamMax: 5,
	milestones: [
		{
			key: "submission_close",
			label: "Clôture des soumissions",
			startsAt: "2026-10-25T17:00:00.000Z",
			endsAt: null,
		},
	],
	sourceUrl: "https://systalink.com/fr/coupe-afrique-des-developpeurs-cadev",
	verifiedAt: "2026-10-03T00:00:00.000Z",
};

// The authorization guard behind every admin procedure (spec §2). Throws the typed
// UNAUTHORIZED / FORBIDDEN error declared on the admin contract.
const isAdmin = impl.middleware(async ({ context, next }) => {
	const result = requireAdmin(context.session);
	if (!result.ok) {
		throw new ORPCError(result.code);
	}
	return next();
});

export const appRouter = impl.router({
	health: {
		check: impl.health.check.handler(() => ({ status: "ok" as const })),
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
		list: impl.hackathons.list.handler(() => ({
			items: [cadev],
			nextCursor: null,
		})),
		get: impl.hackathons.get.handler(({ input, errors }) => {
			if (input.slug !== cadev.slug) {
				throw errors.NOT_FOUND();
			}
			return cadev;
		}),
	},
	admin: {
		auditLog: {
			list: impl.admin.auditLog.list
				.use(isAdmin)
				.handler(async ({ context, input }) => {
					const rows = await context.db
						.select()
						.from(auditLog)
						.orderBy(desc(auditLog.createdAt))
						.limit(input.limit);
					return {
						items: rows.map((row) => ({
							id: row.id,
							actorId: row.actorId,
							action: row.action,
							targetType: row.targetType,
							targetId: row.targetId,
							createdAt: row.createdAt.toISOString(),
						})),
						nextCursor: null,
					};
				}),
		},
	},
});

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterContractClient<typeof contract>;
