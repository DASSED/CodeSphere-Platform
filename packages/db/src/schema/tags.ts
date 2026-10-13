import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

// Tags a Member follows (#65): they scope the For You feed. `tag` is the normalized form (trimmed,
// lowercase), the same one stored in `questions.tags`. Following and unfollowing is owned by #44.
export const tagFollows = pgTable(
	"tag_follows",
	{
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		tag: text("tag").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [primaryKey({ columns: [t.userId, t.tag] })],
);
