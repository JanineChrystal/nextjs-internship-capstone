CREATE TABLE "Notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipientId" uuid NOT NULL,
	"actorId" uuid,
	"workspaceId" uuid,
	"projectId" uuid,
	"taskId" uuid,
	"actionType" "ActionType" NOT NULL,
	"message" text NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_recipientId_Users_id_fk" FOREIGN KEY ("recipientId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_actorId_Users_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_workspaceId_Workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_projectId_Projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_taskId_Tasks_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."Tasks"("id") ON DELETE cascade ON UPDATE no action;