CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"author_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"body_html" text NOT NULL,
	"language" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"tags" text[] NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "questions_author_idempotency" UNIQUE("author_id","idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_author_id_user_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id");