CREATE TABLE "tag_follows" (
	"user_id" text,
	"tag" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tag_follows_pkey" PRIMARY KEY("user_id","tag")
);
--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "questions_created_at_idx" ON "questions" ("created_at");--> statement-breakpoint
ALTER TABLE "tag_follows" ADD CONSTRAINT "tag_follows_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;