CREATE INDEX "workspace_url_idx" ON "workspace" USING btree ("workspace_url");--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_workspace_url_unique" UNIQUE("workspace_url");