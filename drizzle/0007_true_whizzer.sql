CREATE TABLE "conversation_members" (
	"conversation_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_members_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"conversation_id" varchar PRIMARY KEY NOT NULL,
	"type" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"message_id" varchar PRIMARY KEY NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"text" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "conversation_id_idx_conversation_members" ON "conversation_members" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "user_id_idx_conversation_members" ON "conversation_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conversation_id_idx_messages" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "sender_id_idx_messages" ON "messages" USING btree ("sender_id");