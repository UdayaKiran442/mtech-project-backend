import { AddUserInDBError } from "../exceptions/user.exceptions";
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
		throw new AddUserInDBError("Failed to add user in DB", { cause: (error as Error).message });
	}
}
