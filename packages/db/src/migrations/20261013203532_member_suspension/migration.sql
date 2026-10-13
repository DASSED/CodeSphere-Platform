ALTER TABLE "user" ADD COLUMN "suspended_at" timestamp(3);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "suspension_reason" text;