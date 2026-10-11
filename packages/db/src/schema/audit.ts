import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

// Admin audit log (spec §2): one row per sensitive admin action. Written by admin
// procedures, read back for the audit view. `actorId` is nullable so a log entry survives
// the deletion of the actor's account.
export const auditLog = pgTable(
	"audit_log",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		actorId: text("actor_id").references(() => user.id, {
			onDelete: "set null",
		}),
		action: text("action").notNull(),
		targetType: text("target_type").notNull(),
		targetId: text("target_id"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("audit_log_actor_idx").on(table.actorId),
		index("audit_log_created_idx").on(table.createdAt),
	],
);
