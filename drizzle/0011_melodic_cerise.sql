CREATE TABLE "parsed_repos" (
	"repo_name" varchar PRIMARY KEY NOT NULL,
	"branch" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parsed_repos_pkey" PRIMARY KEY("repo_name","user_id")
);
