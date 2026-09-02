DROP INDEX "workspace_id_idx_codebot_chat";--> statement-breakpoint
CREATE INDEX "workspace_id_user_id_idx_codebot_chat" ON "codebot_chat" USING btree ("workspace_id","user_id");