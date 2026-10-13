import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

// Question (#67): Markdown source kept as written, `bodyHtml` is its sanitized rendering.
// `version` guards concurrent edits (CONFLICT); `deletedAt` marks a soft delete.
export const questions = pgTable("questions", {
	id: uuid("id").defaultRandom().primaryKey(),
	authorId: text("author_id")
		.notNull()
		.references(() => user.id),
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
});

// Idempotency for question creation: a replayed key returns the question it already made.
export const idempotencyKeys = pgTable("idempotency_keys", {
	id: text("id").primaryKey(),
	questionId: uuid("question_id")
		.notNull()
		.references(() => questions.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
