import { eq } from "drizzle-orm";

import { AddUserInDBError, GetUserByEmailFromDBError, GetUserByIdFromDBError, UpdateUserInDBError } from "../exceptions/user.exceptions";
import { generateNanoId } from "../utils/nano.utils";
import db from "./db";
import { users } from "./schema";
import type { IUpdateUserPayload } from "../types/types";

// Function to add a user to the database
export async function addUserInDB(payload: { name: string; email: string; passwordHash: string; organisationId?: string }) {
	try {
		const insertPayload = {
			userId: `user_${generateNanoId()}`,
			email: payload.email,
			name: payload.name,
			passwordHash: payload.passwordHash,
			organisationId: payload.organisationId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		await db.insert(users).values(insertPayload);
		return insertPayload;
	} catch (error) {
		throw new AddUserInDBError("Failed to add user in DB", { cause: (error as Error).cause });
	}
}

// Function to get a user by id from the database
export async function getUserByIdFromDB(userId: string) {
	try {
		const user = await db
			.select({
				userId: users.userId,
				name: users.name,
				email: users.email,
				organisationId: users.organisationId,
				isGithubConnected: users.isGitHubConnected,
				githubUsername: users.githubUsername,
				githubInstallationId: users.githubInstallationId,
			})
			.from(users)
			.where(eq(users.userId, userId));
		return user[0];
	} catch (error) {
		throw new GetUserByIdFromDBError("Failed to get user id from db", { cause: (error as Error).cause });
	}
}

// Function to get a user by email from the database
export async function getUserByEmailFromDB(email: string) {
	try {
		const user = await db.select().from(users).where(eq(users.email, email));
		return user[0];
	} catch (error) {
		throw new GetUserByEmailFromDBError("Failed to get user by email from db", { cause: (error as Error).cause });
	}
}

// Function to update a user in the database
export async function updateUserInDB(payload: IUpdateUserPayload) {
	try {
		const updatedPayload = {
			...payload,
			updatedAt: new Date(),
		};
		await db.update(users).set(updatedPayload).where(eq(users.userId, payload.userId));
	} catch (error) {
		throw new UpdateUserInDBError("Failed to update user in DB", { cause: (error as Error).cause });
	}
}
