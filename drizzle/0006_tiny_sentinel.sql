CREATE TABLE "invitations" (
	"invitation_id" varchar PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"organisation_id" varchar NOT NULL,
	"invited_by" varchar NOT NULL,
	"accepted" boolean DEFAULT false NOT NULL,
	"new_user" boolean NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "konwledge_base" (
	"file_id" varchar PRIMARY KEY NOT NULL,
	"workspace_id" varchar NOT NULL,
	"file_url" varchar NOT NULL,
	"key" varchar NOT NULL,
	"uploaded_by" varchar NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "workspace_id_idx";--> statement-breakpoint
CREATE INDEX "workspace_id_idx_knowledge_base" ON "konwledge_base" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "workspace_id_idx_members" ON "workspace_members" USING btree ("workspace_id");