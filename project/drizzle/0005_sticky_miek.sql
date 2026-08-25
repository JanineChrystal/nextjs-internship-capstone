ALTER TABLE "Projects" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "Projects" ALTER COLUMN "status" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."ProjectStatus";--> statement-breakpoint
CREATE TYPE "public"."ProjectStatus" AS ENUM('active', 'completed', 'overdue', 'archived');--> statement-breakpoint
ALTER TABLE "Projects" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."ProjectStatus";--> statement-breakpoint
ALTER TABLE "Projects" ALTER COLUMN "status" SET DATA TYPE "public"."ProjectStatus" USING "status"::"public"."ProjectStatus";