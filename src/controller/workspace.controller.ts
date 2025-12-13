import { UpdateUserInDBError } from "../exceptions/user.exceptions";
import { CreateWorkspaceError, CreateWorkspaceInDBError } from "../exceptions/workspace.exceptions";
import { updateUserInDB } from "../repository/user.repository";
import { createWorkspaceInDB } from "../repository/workspace.repository";
import type { ICreateWorkspaceSchema } from "../routes/v1/workspace.route";

export async function createWorkspace(payload: ICreateWorkspaceSchema) {
	try {
		// create workspace
		const newWorkspace = await createWorkspaceInDB(payload);
		// update user with workspace id and organisation
		await updateUserInDB({
			userId: payload.adminId,
			workspaceId: newWorkspace.workspaceId,
			organisationId: payload.organisationId,
		});
		return newWorkspace;
	} catch (error) {
		if (error instanceof CreateWorkspaceInDBError || error instanceof UpdateUserInDBError) {
			throw error;
		}
		throw new CreateWorkspaceError("Failed to create workspace", { cause: (error as Error).cause });
	}
}
