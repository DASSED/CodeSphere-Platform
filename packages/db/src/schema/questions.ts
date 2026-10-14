import {
	index,
	integer,
	pgTable,
	primaryKey,
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
		// Net votes (#65): kept by the votes module (#48); feeds the hot score of the feed.
		score: integer("score").default(0).notNull(),
		// The Accepted answer (#70): set by the Question's author, null while there is none.
		acceptedAnswerId: uuid("accepted_answer_id"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		deletedAt: timestamp("deleted_at"),
	},
	(t) => [
		unique("questions_author_idempotency").on(t.authorId, t.idempotencyKey),
		index("questions_created_at_idx").on(t.createdAt),
	],
);

// Answer (#70): at most one per Member per Question (unique index), Markdown kept as written with its
// sanitized rendering. `score` is the net votes, kept by the votes module (#71).
export const answers = pgTable(
	"answers",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		questionId: uuid("question_id")
			.notNull()
			.references(() => questions.id),
		authorId: text("author_id")
			.notNull()
			.references(() => user.id),
		// Scoped to its author like the Question's: a replay returns the answer it created.
		idempotencyKey: text("idempotency_key").notNull(),
		body: text("body").notNull(),
		bodyHtml: text("body_html").notNull(),
		version: integer("version").default(1).notNull(),
		score: integer("score").default(0).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		deletedAt: timestamp("deleted_at"),
	},
	(t) => [
		unique("answers_question_author").on(t.questionId, t.authorId),
		unique("answers_author_idempotency").on(t.authorId, t.idempotencyKey),
		index("answers_question_idx").on(t.questionId),
	],
);

// Vote (#71): one per Member and target, `value` is +1 or -1. A Score is the sum of a target's votes.
export const votes = pgTable(
	"votes",
	{
		userId: text("user_id")
			.notNull()
			.references(() => user.id),
		targetType: text("target_type", { enum: ["question", "answer"] }).notNull(),
		targetId: uuid("target_id").notNull(),
		value: integer("value").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [
		primaryKey({ columns: [t.userId, t.targetType, t.targetId] }),
		index("votes_target_idx").on(t.targetType, t.targetId),
	],
);
