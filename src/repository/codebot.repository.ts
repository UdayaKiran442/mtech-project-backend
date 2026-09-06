import { and, eq } from "drizzle-orm";
import { CreateCodebotChatInDBError, FetchCodebotChatByIdFromDBError, FetchUserCodebotChatsFromDBError, UpdateCodebotChatNameInDBError } from "../exceptions/codebot.exceptions";
import type { ICreateCodebotChatSchema, IFetchCodebotChatsSchema, IUpdateCodebotChatNameSchema } from "../routes/v1/codebot.route";
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

export async function fetchUserCodebotChatsFromDB(payload: IFetchCodebotChatsSchema) {
	try {
		return await db
			.select()
			.from(codebotChat)
			.where(and(eq(codebotChat.userId, payload.userId), eq(codebotChat.workspaceId, payload.workspaceId)));
	} catch (error) {
		throw new FetchUserCodebotChatsFromDBError("Failed to fetch user codebot chats of the workspace from the db", { cause: (error as Error).message });
	}
}

export async function fetchCodebotChatByIdFromDB(codebotChatId: string) {
	try {
		return await db.select().from(codebotChat).where(eq(codebotChat.codebotChatId, codebotChatId));
	} catch (error) {
		throw new FetchCodebotChatByIdFromDBError("Failed to fetch codebot chat by id from the db", { cause: (error as Error).message });
	}
}

export async function updateCodebotChatNameInDB(payload: IUpdateCodebotChatNameSchema) {
	try {
		await db.update(codebotChat).set({ codebotChatName: payload.codebotChatName, updatedAt: new Date() }).where(eq(codebotChat.codebotChatId, payload.codebotChatId));
	} catch (error) {
		throw new UpdateCodebotChatNameInDBError("Failed to update codebot chat name in the db", { cause: (error as Error).message });
	}
}
