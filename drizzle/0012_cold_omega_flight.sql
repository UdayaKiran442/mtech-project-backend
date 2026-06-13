ALTER TABLE "parsed_repos" DROP CONSTRAINT "parsed_repos_pkey";
--> statement-breakpoint
ALTER TABLE "parsed_repos" ADD CONSTRAINT "parsed_repos_pkey" PRIMARY KEY("repo_name","user_id","branch");