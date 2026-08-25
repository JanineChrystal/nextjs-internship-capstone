CREATE TABLE "ProjectTeams" (
	"projectId" uuid NOT NULL,
	"teamId" uuid NOT NULL,
	"accessLevel" "AccessLevel" DEFAULT 'member' NOT NULL,
	CONSTRAINT "ProjectTeams_projectId_teamId_pk" PRIMARY KEY("projectId","teamId")
);
--> statement-breakpoint
CREATE TABLE "TeamMembers" (
	"teamId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "TeamMembers_teamId_userId_pk" PRIMARY KEY("teamId","userId")
);
--> statement-breakpoint
CREATE TABLE "Teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ProjectTeams" ADD CONSTRAINT "ProjectTeams_projectId_Projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectTeams" ADD CONSTRAINT "ProjectTeams_teamId_Teams_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."Teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TeamMembers" ADD CONSTRAINT "TeamMembers_teamId_Teams_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."Teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TeamMembers" ADD CONSTRAINT "TeamMembers_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Teams" ADD CONSTRAINT "Teams_workspaceId_Workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspaces"("id") ON DELETE cascade ON UPDATE no action;