CREATE TABLE "sub_modules" (
	"sub_module_id" serial PRIMARY KEY NOT NULL,
	"parsed_repo_id" integer NOT NULL,
	"file_path" varchar NOT NULL,
	"module_name" varchar NOT NULL,
	"module_type" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sub_modules" ADD CONSTRAINT "sub_modules_parsed_repo_id_parsed_repos_parsed_repo_id_fk" FOREIGN KEY ("parsed_repo_id") REFERENCES "public"."parsed_repos"("parsed_repo_id") ON DELETE cascade ON UPDATE no action;