CREATE TABLE "PendingInvites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"email" text NOT NULL,
	"invitedBy" uuid NOT NULL,
	"position" text DEFAULT 'Contributor' NOT NULL,
	"accessLevel" "AccessLevel" DEFAULT 'member' NOT NULL,
	"claimedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "PendingInvites" ADD CONSTRAINT "PendingInvites_workspaceId_Workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PendingInvites" ADD CONSTRAINT "PendingInvites_projectId_Projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PendingInvites" ADD CONSTRAINT "PendingInvites_invitedBy_Users_id_fk" FOREIGN KEY ("invitedBy") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "PendingInvites_project_email_live_unique" ON "PendingInvites" USING btree ("workspaceId","email","projectId") WHERE "deletedAt" is null and "projectId" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "PendingInvites_workspace_email_live_unique" ON "PendingInvites" USING btree ("workspaceId","email") WHERE "deletedAt" is null and "projectId" is null;--> statement-breakpoint
CREATE INDEX "PendingInvites_email_idx" ON "PendingInvites" USING btree ("email");