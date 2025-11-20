import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

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
