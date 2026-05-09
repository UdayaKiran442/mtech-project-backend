import { WORKSPACE_MEMBER_ROLES } from "../constants/workspaceMember.constants";
import { AddKnowledgeBaseInDBError } from "../exceptions/knowledgeBase.exceptions";
import { ConvertTextToChunkServiceError, ConvertTextToEmbeddingsServiceError, ExtractTextFromS3FileServiceError, UpsertEmbeddingsServiceError } from "../exceptions/service.exceptions";
import { UpdateUserInDBError } from "../exceptions/user.exceptions";
import { AddKnowledgeToWorkspaceError, CreateWorkspaceError, CreateWorkspaceInDBError, FetchWorkspaceMembersError, IsWorkspaceUrlUniqueError } from "../exceptions/workspace.exceptions";
import { AddWorkspaceMemberInDBError } from "../exceptions/workspaceMember.exceptions";
import { addKnowledgeBaseInDB } from "../repository/knowledgeBase.repository";
import { updateUserInDB } from "../repository/user.repository";
import { checkIfWorkspaceUrlIsUniqueInDB, createWorkspaceInDB } from "../repository/workspace.repository";
import { addWorkspaceMemberInDB, getWorkspaceMembersFromDB } from "../repository/workspaceMembers.repository";
import type { IAddKnowledgeSchema, ICreateWorkspaceSchema, IFetchWorkspaceMembersSchema } from "../routes/v1/workspace.route";
import { convertTextToChunkService, extractTextFromS3FileService } from "../services/langchain.service";
import { upsertEmbeddingsService } from "../services/pinecone.service";
import { convertTextToEmbeddingsService } from "../services/python.service";

/**
 *
 * @param payload
 * @description Function to create a new workspace
 * - Creates a new workspace
 * - Updates user with organisation id
 * - Adds user to workspace members table with admin role
 * @returns Returns details of new workspace created
 */
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

/**
 *
 * @param workspaceUrl
 * @description Function to check if workspace url is unique or not
 * - Calls db function to check if workspace url is unique
 * @returns Return boolean value
 */
export async function isWorkspaceUrlUnique(workspaceUrl: string) {
	try {
		// db call to check if workspace url is unique
		const existingUrl = await checkIfWorkspaceUrlIsUniqueInDB(workspaceUrl);
		return existingUrl.length === 0;
	} catch (error) {
		throw new IsWorkspaceUrlUniqueError("Failed to check if workspace URL is unique", { cause: (error as Error).cause });
	}
}

/**
 *
 * @param payload
 * @description Function to fetch workspace members
 * @returns
 */
export async function fetchWorkspaceMembers(payload: IFetchWorkspaceMembersSchema) {
	try {
		return await getWorkspaceMembersFromDB(payload.workspaceId);
	} catch (error) {
		throw new FetchWorkspaceMembersError("Failed to fetch workspace members", { cause: (error as Error).cause });
	}
}

/**
 *
 * @param payload
 * @description Function to add knowledge to workspace
 * - First extract text from S3 file url
 * - Convert text into chunks
 * - Convert text chunks into embeddings using python service
 * - Store embeddings in vector db and file details in relational db
 * @returns void
 */
export async function addKnowledgeToWorkspace(payload: IAddKnowledgeSchema) {
	try {
		// extract text from file
		const text = await extractTextFromS3FileService(payload.key);
		// split text into chunks
		const textChunks = await convertTextToChunkService(text);

		// convert into embeddings
		for (const chunk of textChunks) {
			const embeddings = await convertTextToEmbeddingsService(chunk);
			// store in vector db and relational db
			await upsertEmbeddingsService({
				metadata: { workspaceId: payload.workspaceId, uploadedBy: payload.uploadedBy, fileUrl: payload.fileUrl, textChunk: chunk },
				vectors: embeddings.embeddings,
				index: payload.index,
			});
		}
		// store file details in relational db
		await addKnowledgeBaseInDB({
			workspaceId: payload.workspaceId,
			uploadedBy: payload.uploadedBy,
			fileUrl: payload.fileUrl,
			key: payload.key,
		});
	} catch (error) {
		if (
			error instanceof ExtractTextFromS3FileServiceError ||
			error instanceof ConvertTextToChunkServiceError ||
			error instanceof ConvertTextToEmbeddingsServiceError ||
			error instanceof UpsertEmbeddingsServiceError ||
			error instanceof AddKnowledgeBaseInDBError
		) {
			throw error;
		}
		throw new AddKnowledgeToWorkspaceError("Failed to add knowledge to workspace", { cause: (error as Error).message });
	}
}
