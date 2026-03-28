import { boolean, index, integer, pgTable, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	userId: varchar("user_id").primaryKey(),
	name: varchar("name").notNull(),
	email: varchar("email").notNull().unique(),
	passwordHash: varchar("password_hash").notNull(),
	organisationId: varchar("organisation_id"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (users) => ({
	emailIdx: index("email_idx").on(users.email),
}));

export const organisation = pgTable("organisation", {
	organisationId: varchar("organisation_id").primaryKey(),
	orgName: varchar("org_name").notNull(),
	orgLogoUrl: varchar("org_logo_url"),
	orgSize: varchar("org_size").notNull(),
	industry: varchar("industry").notNull(),
	adminId: varchar("admin_id").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workspace = pgTable(
	"workspace",
	{
		workspaceId: varchar("workspace_id").primaryKey(),
		workspaceName: varchar("workspace_name").notNull(),
		workspaceUrl: varchar("workspace_url").notNull().unique(),
		organisationId: varchar("organisation_id").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(workspace) => ({
		workspaceUrlIdx: index("workspace_url_idx").on(workspace.workspaceUrl),
	}),
);

export const workspaceMembers = pgTable("workspace_members", {
	memberId: varchar("member_id").primaryKey(),
	workspaceId: varchar("workspace_id").notNull(),
	userId: varchar("user_id").notNull(),
	role: varchar("role").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (workspaceMembers) => ({
	workspaceIdIdx: index("workspace_id_idx_members").on(workspaceMembers.workspaceId),
	userIdIdx: index("user_id_idx").on(workspaceMembers.userId),
}));

export const invitations = pgTable("invitations", {
	invitationId: varchar("invitation_id").primaryKey(),
	email: varchar("email").notNull(),
	workspaceId: varchar("workspace_id").notNull(),
	organisationId: varchar("organisation_id").notNull(),
	invitedBy: varchar("invited_by").notNull(),
	accepted: boolean("accepted").default(false).notNull(),
	newUser: boolean("new_user").notNull(),
	invitedAt: timestamp("invited_at").defaultNow().notNull(),
})

export const knowledgeBase = pgTable("konwledge_base", {
	fileId: varchar("file_id").primaryKey(),
	workspaceId: varchar("workspace_id").notNull(),
	fileUrl: varchar("file_url").notNull(),
	key: varchar("key").notNull(), // s3 key of the file
	uploadedBy: varchar("uploaded_by").notNull(), // id of the person who uploaded the file
	uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),	
}, (knowledgeBase) => ({
	workspaceIdIdx: index("workspace_id_idx_knowledge_base").on(knowledgeBase.workspaceId),
}))

export const conversations = pgTable("conversations", {
	conversationId: varchar("conversation_id").primaryKey(),
	type: varchar("type").notNull(), // "dm" or "group"
	createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const conversationMembers = pgTable("conversation_members", {
	conversationId: varchar("conversation_id").notNull(),
	userId: varchar("user_id").notNull(),
	joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (conversationMembers) => ({
	conversationIdIdx: index("conversation_id_idx_conversation_members").on(conversationMembers.conversationId),
	userIdIdx: index("user_id_idx_conversation_members").on(conversationMembers.userId),
	primaryKey: primaryKey({columns: [conversationMembers.conversationId, conversationMembers.userId]})
}))	

export const messages = pgTable("messages", {
	messageId: varchar("message_id").primaryKey(),
	conversationId: varchar("conversation_id").notNull(),
	senderId: varchar("sender_id").notNull(),
	text: varchar("text").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
}, (messages) => ({
	conversationIdIdx: index("conversation_id_idx_messages").on(messages.conversationId),
	senderIdIdx: index("sender_id_idx_messages").on(messages.senderId),
}))