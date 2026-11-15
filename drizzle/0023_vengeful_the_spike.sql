ALTER TABLE "parsed_repos" DROP CONSTRAINT "parsed_repos_pkey";--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'parsed_repos'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "parsed_repos" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "parsed_repo_files" ADD COLUMN "parsed_repo_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "parsed_repos" ADD COLUMN "parsed_repo_id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "parsed_repos" ADD COLUMN "owner" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "parsed_repo_files" ADD CONSTRAINT "parsed_repo_files_parsed_repo_id_parsed_repos_parsed_repo_id_fk" FOREIGN KEY ("parsed_repo_id") REFERENCES "public"."parsed_repos"("parsed_repo_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parsed_repo_files" DROP COLUMN "repo_name";--> statement-breakpoint
ALTER TABLE "parsed_repo_files" DROP COLUMN "branch";--> statement-breakpoint
ALTER TABLE "parsed_repo_files" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "parsed_repo_files" DROP CONSTRAINT "parsed_repo_files_pkey";
--> statement-breakpoint
ALTER TABLE "parsed_repo_files" ADD CONSTRAINT "parsed_repo_files_pkey" PRIMARY KEY("parsed_repo_id","file_path");--> statement-breakpoint
ALTER TABLE "parsed_repos" ADD CONSTRAINT "parsed_repos_unique" UNIQUE("workspace_id","user_id","owner","repo_name","branch");