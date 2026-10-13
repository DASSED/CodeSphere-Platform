import {
	integer,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// Question (#67): Markdown source kept as written, `bodyHtml` is its sanitized rendering.
// `version` guards concurrent edits (CONFLICT); `deletedAt` marks a soft delete.
// `idempotencyKey` is scoped to its author: replaying a key returns that author's question,
// and the unique index makes a racing duplicate fail in the same statement, with no transaction.
export const questions = pgTable(
	"questions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		authorId: text("author_id")
			.notNull()
			.references(() => user.id),
		idempotencyKey: text("idempotency_key").notNull(),
		title: text("title").notNull(),
		body: text("body").notNull(),
		bodyHtml: text("body_html").notNull(),
		language: text("language", { enum: ["fr", "en"] }).notNull(),
		status: text("status", { enum: ["open", "answered", "closed"] })
			.notNull()
			.default("open"),
		tags: text("tags").array().notNull(),
		version: integer("version").default(1).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		deletedAt: timestamp("deleted_at"),
	},
	(t) => [
		unique("questions_author_idempotency").on(t.authorId, t.idempotencyKey),
	],
);
