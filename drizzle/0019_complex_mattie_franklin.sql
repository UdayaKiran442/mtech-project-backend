CREATE INDEX "workspace_id_idx_codebot_chat" ON "codebot_chat" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "user_id_idx_codebot_chat" ON "codebot_chat" USING btree ("user_id");