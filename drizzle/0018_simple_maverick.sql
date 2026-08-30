CREATE TABLE "codebot_chat" (
	"codebot_chat_id" varchar PRIMARY KEY NOT NULL,
	"workspace_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"codebot_chat_name" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "codebot_messages" (
	"codebot_message_id" varchar PRIMARY KEY NOT NULL,
	"codebot_chat_id" varchar NOT NULL,
	"prompt" varchar NOT NULL,
	"response" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
