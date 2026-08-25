ALTER TABLE "Boards" ADD COLUMN "isCompletionBoard" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "Tasks" ADD COLUMN "isCompleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Backfill: completion state was previously implied by the literal status text.
UPDATE "Tasks" SET "isCompleted" = true WHERE "status" = 'Completed';--> statement-breakpoint
-- Backfill: the seeded completion column was identified by this exact name.
-- Boards renamed away from it keep the flag unset and can be designated from
-- the board menu.
UPDATE "Boards" SET "isCompletionBoard" = true WHERE "name" = 'Completed' AND "deletedAt" IS NULL;
