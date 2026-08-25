ALTER TABLE "NotificationSettings" ADD COLUMN "emailProjectInvites" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "NotificationSettings" ADD COLUMN "emailCommentViolations" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "NotificationSettings" ADD COLUMN "emailProjectOverdue" boolean DEFAULT true NOT NULL;