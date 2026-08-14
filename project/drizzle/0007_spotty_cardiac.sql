CREATE TYPE "public"."CategoryType" AS ENUM('project', 'task');--> statement-breakpoint
CREATE TABLE "Categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#94a3b8' NOT NULL,
	"type" "CategoryType" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Categories_workspaceId_name_type_unique" UNIQUE("workspaceId","name","type")
);
--> statement-breakpoint
ALTER TABLE "Categories" ADD CONSTRAINT "Categories_workspaceId_Workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspaces"("id") ON DELETE cascade ON UPDATE no action;