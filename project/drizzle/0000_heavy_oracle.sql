CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" varchar(255),
	"image_url" text,
	"last_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
