CREATE TABLE "hackathon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"organizer" text NOT NULL,
	"summary" text NOT NULL,
	"team_min" integer NOT NULL,
	"team_max" integer NOT NULL,
	"source_url" text NOT NULL,
	"source_note" text,
	"verified_at" timestamp NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hackathon_criterion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"hackathon_id" uuid NOT NULL,
	"label" text NOT NULL,
	"weight" integer NOT NULL,
	"scored_by" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hackathon_milestone" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"hackathon_id" uuid NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp,
	"position" integer NOT NULL,
	CONSTRAINT "hackathon_milestone_key_unique" UNIQUE("hackathon_id","key")
);
--> statement-breakpoint
CREATE TABLE "hackathon_prize" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"hackathon_id" uuid NOT NULL,
	"label" text NOT NULL,
	"amount" text,
	"conditions" text,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "hackathon_criterion_hackathon_idx" ON "hackathon_criterion" ("hackathon_id");--> statement-breakpoint
CREATE INDEX "hackathon_milestone_hackathon_idx" ON "hackathon_milestone" ("hackathon_id");--> statement-breakpoint
CREATE INDEX "hackathon_prize_hackathon_idx" ON "hackathon_prize" ("hackathon_id");--> statement-breakpoint
ALTER TABLE "hackathon_criterion" ADD CONSTRAINT "hackathon_criterion_hackathon_id_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "hackathon"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hackathon_milestone" ADD CONSTRAINT "hackathon_milestone_hackathon_id_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "hackathon"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hackathon_prize" ADD CONSTRAINT "hackathon_prize_hackathon_id_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "hackathon"("id") ON DELETE CASCADE;