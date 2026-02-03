import { WORKSPACE_MEMBER_ROLES } from "../constants/workspaceMember.constants";
import { UpdateUserInDBError } from "../exceptions/user.exceptions";
import { AddKnowledgeToWorkspaceError, CreateWorkspaceError, CreateWorkspaceInDBError, FetchWorkspaceMembersError, IsWorkspaceUrlUniqueError } from "../exceptions/workspace.exceptions";
import { AddWorkspaceMemberInDBError } from "../exceptions/workspaceMember.exceptions";
import { updateUserInDB } from "../repository/user.repository";
import { checkIfWorkspaceUrlIsUniqueInDB, createWorkspaceInDB } from "../repository/workspace.repository";
import { addWorkspaceMemberInDB, getWorkspaceMembersFromDB } from "../repository/workspaceMembers.repository";
import type { IAddKnowledgeSchema, ICreateWorkspaceSchema, IFetchWorkspaceMembersSchema } from "../routes/v1/workspace.route";
import { convertTextToChunkService, extractTextFromS3FileService } from "../services/langchain.service";

export async function createWorkspace(payload: ICreateWorkspaceSchema) {
	try {
		// create workspace
		const newWorkspace = await createWorkspaceInDB(payload);
		// update user with workspace id and organisation
		await updateUserInDB({
			userId: payload.adminId,
			organisationId: payload.organisationId,
		});
		// add workspace admin as member to workspace members table
		await addWorkspaceMemberInDB({
			workspaceId: newWorkspace.workspaceId,
			userId: payload.adminId,
			role: WORKSPACE_MEMBER_ROLES.ADMIN,
		});
		return newWorkspace;
	} catch (error) {
		if (error instanceof CreateWorkspaceInDBError || error instanceof UpdateUserInDBError || error instanceof AddWorkspaceMemberInDBError) {
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

export async function fetchWorkspaceMembers(payload: IFetchWorkspaceMembersSchema) {
	try {
		return await getWorkspaceMembersFromDB(payload.workspaceId);
	} catch (error) {
		throw new FetchWorkspaceMembersError("Failed to fetch workspace members", { cause: (error as Error).cause });
	}
}

export async function addKnowledgeToWorkspace(payload: IAddKnowledgeSchema) {
	try {
		// extract text from file
		const text = await extractTextFromS3FileService(payload.key);
		// split text into chunks
		const textChunks = await convertTextToChunkService(text);
		console.log("Text Chunks: ", textChunks);
		
		// convert into embeddings

		// store in vector db and relational db
	} catch (error) {
		throw new AddKnowledgeToWorkspaceError("Failed to add knowledge to workspace", { cause: (error as Error).message });
	}
}
