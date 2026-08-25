ALTER TABLE "Users" DROP CONSTRAINT "Users_username_unique";--> statement-breakpoint
ALTER TABLE "Users" ADD COLUMN "clerkId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Users" ADD COLUMN "firstName" text;--> statement-breakpoint
ALTER TABLE "Users" ADD COLUMN "lastName" text;--> statement-breakpoint
ALTER TABLE "Users" ADD COLUMN "imageUrl" text;--> statement-breakpoint
ALTER TABLE "Users" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "Users" DROP COLUMN "avatarUrl";--> statement-breakpoint
ALTER TABLE "Users" ADD CONSTRAINT "Users_clerkId_unique" UNIQUE("clerkId");