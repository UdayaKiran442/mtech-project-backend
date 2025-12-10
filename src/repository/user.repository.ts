import { eq } from "drizzle-orm";
import { AddUserInDBError, GetUserByEmailFromDBError, GetUserByIdFromDBError } from "../exceptions/user.exceptions";
import { generateNanoId } from "../utils/nano.utils";
import db from "./db";
import { users } from "./schema";

export async function addUserInDB(payload: { name: string; email: string; passwordHash: string; role: string; workspaceId?: string; organisationId?: string }) {
	try {
		const insertPayload = {
			userId: `user_${generateNanoId()}`,
			email: payload.email,
			name: payload.name,
			passwordHash: payload.passwordHash,
			role: payload.role,
			workspaceId: payload.workspaceId,
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

export async function getUserByIdFromDB(userId: string) {
	try {
		const user = await db
			.select({
				name: users.name,
				email: users.email,
				role: users.role,
				workspaceId: users.workspaceId,
				organisationId: users.organisationId,
			})
			.from(users)
			.where(eq(users.userId, userId));
		return user[0];
	} catch (error) {
		throw new GetUserByIdFromDBError("Failed to get user id from db", { cause: (error as Error).cause });
	}
}

export async function getUserByEmailFromDB(email: string) {
	try {
		const user = await db.select().from(users).where(eq(users.email, email));
		return user[0];
	} catch (error) {
		throw new GetUserByEmailFromDBError("Failed to get user by email from db", { cause: (error as Error).cause });
	}
}
