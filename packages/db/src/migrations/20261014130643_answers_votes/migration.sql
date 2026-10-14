CREATE TABLE "answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"question_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"body" text NOT NULL,
	"body_html" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "answers_question_author" UNIQUE("question_id","author_id"),
	CONSTRAINT "answers_author_idempotency" UNIQUE("author_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"user_id" text,
	"target_type" text,
	"target_id" uuid,
	"value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "votes_pkey" PRIMARY KEY("user_id","target_type","target_id")
);
--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "accepted_answer_id" uuid;--> statement-breakpoint
CREATE INDEX "answers_question_idx" ON "answers" ("question_id");--> statement-breakpoint
CREATE INDEX "votes_target_idx" ON "votes" ("target_type","target_id");--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id");--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_author_id_user_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");