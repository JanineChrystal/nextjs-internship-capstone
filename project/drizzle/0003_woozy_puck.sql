ALTER TABLE "Tasks" ALTER COLUMN "status" SET DEFAULT 'Not Started';--> statement-breakpoint
ALTER TABLE "Boards" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Boards" DROP COLUMN "order";