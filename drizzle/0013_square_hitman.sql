CREATE TABLE "parsed_repo_files" (
	"repo_name" varchar NOT NULL,
	"branch" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"file_path" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parsed_repo_files_pkey" PRIMARY KEY("repo_name","user_id","branch","file_path")
);
--> statement-breakpoint
CREATE INDEX "file_name_idx" ON "parsed_repo_files" USING btree ("file_name");