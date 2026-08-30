import { CreateCodebotChatInDBError } from "../exceptions/codebot.exceptions";
import type { ICreateCodebotChatSchema } from "../routes/v1/codebot.route";
import { generateNanoId } from "../utils/nano.utils";
import db from "./db";
import { codebotChat } from "./schema";

export async function createCodebotChatInDB(payload: ICreateCodebotChatSchema) {
	try {
		const insertPayload = {
			codebotChatId: `codebot_chat_${generateNanoId()}`,
			userId: payload.userId,
			workspaceId: payload.workspaceId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		await db.insert(codebotChat).values(insertPayload);
        return insertPayload;
	} catch (error) {
		throw new CreateCodebotChatInDBError("Failed to create codebot chat in the database", { cause: (error as Error).message });
	}
}
