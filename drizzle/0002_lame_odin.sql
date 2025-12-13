CREATE TABLE "organisation" (
	"organisation_id" varchar PRIMARY KEY NOT NULL,
	"org_name" varchar NOT NULL,
	"org_logo_url" varchar,
	"org_size" varchar NOT NULL,
	"industry" varchar NOT NULL,
	"admin_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"workspace_id" varchar PRIMARY KEY NOT NULL,
	"workspace_name" varchar NOT NULL,
	"workspace_url" varchar NOT NULL,
	"organisation_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
