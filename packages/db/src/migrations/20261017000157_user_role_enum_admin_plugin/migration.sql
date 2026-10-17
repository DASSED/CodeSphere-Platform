CREATE TYPE "user_role" AS ENUM('member', 'moderator', 'admin', 'super_admin');--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE "user_role" USING "role"::"user_role";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'member'::"user_role";