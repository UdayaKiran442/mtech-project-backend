ALTER TABLE "users" ADD COLUMN "is_github_connected" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "github_username" varchar;