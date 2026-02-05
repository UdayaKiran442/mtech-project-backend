import { AddKnowledgeBaseInDBError } from "../exceptions/knowledgeBase.exceptions";
import { generateNanoId } from "../utils/nano.utils";
import db from "./db";
import { knowledgeBase } from "./schema";

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
