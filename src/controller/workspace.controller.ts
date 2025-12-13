import { UpdateUserInDBError } from "../exceptions/user.exceptions";
import { CreateWorkspaceError, CreateWorkspaceInDBError, IsWorkspaceUrlUniqueError } from "../exceptions/workspace.exceptions";
import { updateUserInDB } from "../repository/user.repository";
import { checkIfWorkspaceUrlIsUniqueInDB, createWorkspaceInDB } from "../repository/workspace.repository";
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

export async function isWorkspaceUrlUnique(workspaceUrl: string) {
	try {
		// db call to check if workspace url is unique
		const existingUrl = await checkIfWorkspaceUrlIsUniqueInDB(workspaceUrl);
		return existingUrl.length === 0;
	} catch (error) {
		throw new IsWorkspaceUrlUniqueError("Failed to check if workspace URL is unique", { cause: (error as Error).cause });
	}
}
