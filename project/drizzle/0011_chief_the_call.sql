ALTER TABLE "ProjectTeams" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "ProjectTeams" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "Teams" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "Teams" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
-- Backfill: the ADD COLUMN default stamps every pre-existing team with the
-- migration time, which would misreport them all as just-updated. Seed from
-- createdAt instead so "never updated since creation" stays truthful.
UPDATE "Teams" SET "updatedAt" = "createdAt";--> statement-breakpoint
CREATE INDEX "ProjectTeams_teamId_idx" ON "ProjectTeams" USING btree ("teamId");--> statement-breakpoint
CREATE INDEX "TeamMembers_userId_idx" ON "TeamMembers" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "Teams_workspaceId_name_live_unique" ON "Teams" USING btree ("workspaceId","name") WHERE "deletedAt" is null;--> statement-breakpoint
CREATE INDEX "WorkspaceMembers_userId_idx" ON "WorkspaceMembers" USING btree ("userId");