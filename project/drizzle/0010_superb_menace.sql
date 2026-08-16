ALTER TABLE "Tasks" ADD COLUMN "statusOverriddenAt" timestamp;--> statement-breakpoint
ALTER TABLE "Tasks" ADD COLUMN "previousBoardId" uuid;