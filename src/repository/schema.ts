import { boolean, index, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	userId: varchar("user_id").primaryKey(),
	name: varchar("name").notNull(),
	email: varchar("email").notNull().unique(),
	passwordHash: varchar("password_hash").notNull(),
	organisationId: varchar("organisation_id"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
	workspaceIdIdx: index("workspace_id_idx").on(workspaceMembers.workspaceId),
	userIdIdx: index("user_id_idx").on(workspaceMembers.userId),
}));

export const invitations = pgTable("invitations", {
	invitationId: varchar("invitation_id").primaryKey(),
	email: varchar("email").notNull(),
	workspaceId: varchar("workspace_id").notNull(),
	organisationId: varchar("organisation_id").notNull(),
	invitedBy: varchar("invited_by").notNull(),
	accepted: boolean("accepted").default(false).notNull(),
	invitedAt: timestamp("invited_at").defaultNow().notNull(),
})