CREATE TYPE "public"."ContactTopic" AS ENUM('general', 'demo', 'support', 'partnership');--> statement-breakpoint
CREATE TABLE "ContactMessages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"organization" text,
	"topic" "ContactTopic" NOT NULL,
	"message" text NOT NULL,
	"respondedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE INDEX "contact_messages_created_at_idx" ON "ContactMessages" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "contact_messages_email_idx" ON "ContactMessages" USING btree ("email");