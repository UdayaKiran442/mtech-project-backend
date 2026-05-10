import { eq } from "drizzle-orm";
import { AddKnowledgeBaseInDBError, DeleteKnowledgeBaseFileFromDBError, GetFileDetailsFromDBError } from "../exceptions/knowledgeBase.exceptions";
import { generateNanoId } from "../utils/nano.utils";
import db from "./db";
import { knowledgeBase } from "./schema";

// Function to add a knowledge file to the database
export async function addKnowledgeBaseInDB(payload: { workspaceId: string; uploadedBy: string; fileUrl: string; key: string }) {
	try {
		const insertPayload = {
			fileId: `file_${generateNanoId()}`,
			workspaceId: payload.workspaceId,
			fileUrl: payload.fileUrl,
			key: payload.key,
			uploadedBy: payload.uploadedBy,
		};
		await db.insert(knowledgeBase).values(insertPayload);
		return insertPayload;
	} catch (error) {
		throw new AddKnowledgeBaseInDBError("Failed to add knowledge base in DB", { cause: (error as Error).message });
	}
}

// Function to fetch knowledge files of a workspace from the database using fileId
export async function getFileDetailsFromDB(fileId: string) {
	try {
		return await db.select().from(knowledgeBase).where(eq(knowledgeBase.fileId, fileId));
	} catch (error) {
		throw new GetFileDetailsFromDBError("Failed to fetch file details from DB", { cause: (error as Error).message });
	}
}

export async function deleteKnowledgeBaseFileFromDB(fileId: string) {
	try {
		await db.delete(knowledgeBase).where(eq(knowledgeBase.fileId, fileId));
	} catch (error) {
		throw new DeleteKnowledgeBaseFileFromDBError("Failed to delete knowledge base file from DB", { cause: (error as Error).message });
	}
}
