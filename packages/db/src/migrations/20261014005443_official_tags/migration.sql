CREATE TABLE "tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL UNIQUE,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
-- Backfill: the Hackathon's own Tag, and every Tag already used by a Question.
INSERT INTO "tag" ("name") VALUES ('cadev-2026') ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
INSERT INTO "tag" ("name") SELECT DISTINCT lower(btrim(t)) FROM "questions", unnest("tags") AS t WHERE btrim(t) <> '' ON CONFLICT ("name") DO NOTHING;
