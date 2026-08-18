DROP INDEX "PendingInvites_project_email_live_unique";--> statement-breakpoint
DROP INDEX "PendingInvites_workspace_email_live_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "PendingInvites_project_email_live_unique" ON "PendingInvites" USING btree ("workspaceId","email","projectId") WHERE "deletedAt" is null and "claimedAt" is null and "projectId" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "PendingInvites_workspace_email_live_unique" ON "PendingInvites" USING btree ("workspaceId","email") WHERE "deletedAt" is null and "claimedAt" is null and "projectId" is null;