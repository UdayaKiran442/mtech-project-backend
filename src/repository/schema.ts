import { index, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	userId: varchar("user_id").primaryKey(),
	name: varchar("name").notNull(),
	email: varchar("email").notNull().unique(),
	passwordHash: varchar("password_hash").notNull(),
	workspaceId: varchar("workspace_id"),
	organisationId: varchar("organisation_id"),
	role: varchar("role").notNull(),
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
