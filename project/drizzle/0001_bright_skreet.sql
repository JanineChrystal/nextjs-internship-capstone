CREATE TYPE "public"."AccessLevel" AS ENUM('owner', 'co-owner', 'member', 'guest');--> statement-breakpoint
CREATE TYPE "public"."ActionType" AS ENUM('INVITE_SENT', 'INVITE_ACCEPTED', 'WORKSPACE_MEMBER_REMOVED', 'PROJECT_MEMBER_ADDED', 'PROJECT_MEMBER_REMOVED', 'BOARD_CREATED', 'BOARD_REORDERED', 'BOARD_DELETED', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'COMMENT_ADDED');--> statement-breakpoint
CREATE TYPE "public"."AttachmentType" AS ENUM('file', 'link');--> statement-breakpoint
CREATE TYPE "public"."ProjectStatus" AS ENUM('active', 'archived', 'completed');--> statement-breakpoint
CREATE TYPE "public"."TaskPriority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."WorkspaceStatus" AS ENUM('pending', 'active');--> statement-breakpoint
CREATE TABLE "ActivityLogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"taskId" uuid,
	"actorId" uuid NOT NULL,
	"targetUserId" uuid,
	"actionType" "ActionType" NOT NULL,
	"details" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "Attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taskId" uuid NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"type" "AttachmentType" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "Boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projectId" uuid NOT NULL,
	"workspaceId" uuid NOT NULL,
	"name" text NOT NULL,
	"order" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "Checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taskId" uuid NOT NULL,
	"title" text NOT NULL,
	"isCompleted" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "CommentMentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commentId" uuid NOT NULL,
	"mentionedUserId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "CommentMentions_commentId_mentionedUserId_unique" UNIQUE("commentId","mentionedUserId")
);
--> statement-breakpoint
CREATE TABLE "Comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taskId" uuid NOT NULL,
	"authorId" uuid NOT NULL,
	"parentId" uuid,
	"body" text NOT NULL,
	"isFlagged" boolean DEFAULT false NOT NULL,
	"flagReason" text,
	"moderatedById" uuid,
	"moderatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "NotificationSettings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"emailWorkspaceInvites" boolean DEFAULT true NOT NULL,
	"emailTaskCompletions" boolean DEFAULT true NOT NULL,
	"emailProjectCompletions" boolean DEFAULT true NOT NULL,
	"emailCommentMentions" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "NotificationSettings_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "ProjectInvites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projectId" uuid NOT NULL,
	"inviteToken" text NOT NULL,
	"defaultAccessLevel" "AccessLevel" DEFAULT 'member' NOT NULL,
	"defaultPosition" text DEFAULT 'Contributor' NOT NULL,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "ProjectInvites_inviteToken_unique" UNIQUE("inviteToken")
);
--> statement-breakpoint
CREATE TABLE "ProjectMembers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projectId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"position" text NOT NULL,
	"accessLevel" "AccessLevel" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "ProjectMembers_projectId_userId_unique" UNIQUE("projectId","userId")
);
--> statement-breakpoint
CREATE TABLE "Projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL,
	"ownerId" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "ProjectStatus" DEFAULT 'active' NOT NULL,
	"priority" "TaskPriority" DEFAULT 'medium' NOT NULL,
	"category" text,
	"startDate" timestamp,
	"dueDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "TaskAssignees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taskId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "TaskAssignees_taskId_userId_unique" UNIQUE("taskId","userId")
);
--> statement-breakpoint
CREATE TABLE "Tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projectId" uuid NOT NULL,
	"boardId" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"status" text NOT NULL,
	"priority" "TaskPriority" NOT NULL,
	"startDate" timestamp,
	"dueDate" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "Users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"avatarUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "Users_username_unique" UNIQUE("username"),
	CONSTRAINT "Users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "WorkspaceMembers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"status" "WorkspaceStatus" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "WorkspaceMembers_workspaceId_userId_unique" UNIQUE("workspaceId","userId")
);
--> statement-breakpoint
CREATE TABLE "Workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ownerId" uuid NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "ActivityLogs" ADD CONSTRAINT "ActivityLogs_workspaceId_Workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityLogs" ADD CONSTRAINT "ActivityLogs_projectId_Projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityLogs" ADD CONSTRAINT "ActivityLogs_taskId_Tasks_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."Tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityLogs" ADD CONSTRAINT "ActivityLogs_actorId_Users_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityLogs" ADD CONSTRAINT "ActivityLogs_targetUserId_Users_id_fk" FOREIGN KEY ("targetUserId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Attachments" ADD CONSTRAINT "Attachments_taskId_Tasks_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."Tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Boards" ADD CONSTRAINT "Boards_projectId_Projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Boards" ADD CONSTRAINT "Boards_workspaceId_Workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Checklists" ADD CONSTRAINT "Checklists_taskId_Tasks_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."Tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CommentMentions" ADD CONSTRAINT "CommentMentions_commentId_Comments_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."Comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CommentMentions" ADD CONSTRAINT "CommentMentions_mentionedUserId_Users_id_fk" FOREIGN KEY ("mentionedUserId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_taskId_Tasks_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."Tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_authorId_Users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_moderatedById_Users_id_fk" FOREIGN KEY ("moderatedById") REFERENCES "public"."Users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "NotificationSettings" ADD CONSTRAINT "NotificationSettings_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectInvites" ADD CONSTRAINT "ProjectInvites_projectId_Projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectMembers" ADD CONSTRAINT "ProjectMembers_projectId_Projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectMembers" ADD CONSTRAINT "ProjectMembers_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Projects" ADD CONSTRAINT "Projects_workspaceId_Workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Projects" ADD CONSTRAINT "Projects_ownerId_Users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TaskAssignees" ADD CONSTRAINT "TaskAssignees_taskId_Tasks_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."Tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TaskAssignees" ADD CONSTRAINT "TaskAssignees_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Tasks" ADD CONSTRAINT "Tasks_projectId_Projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Tasks" ADD CONSTRAINT "Tasks_boardId_Boards_id_fk" FOREIGN KEY ("boardId") REFERENCES "public"."Boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "WorkspaceMembers" ADD CONSTRAINT "WorkspaceMembers_workspaceId_Workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "WorkspaceMembers" ADD CONSTRAINT "WorkspaceMembers_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Workspaces" ADD CONSTRAINT "Workspaces_ownerId_Users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;