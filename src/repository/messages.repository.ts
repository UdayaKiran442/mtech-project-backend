import { eq } from "drizzle-orm";
import db from "./db";
import { messages } from "./schema";
import { AddMessageToDBError, FetchMessagesFromDBError } from "../exceptions/messages.exceptions";
import type { ISendMessageSchema } from "../routes/v1/chat.route";
import { generateNanoId } from "../utils/nano.utils";

// Function to fetch chat messages from the database based on conversation id
export async function fetchChatMessagesFromDB(conversationId: string) {
	try {
		return await db.select().from(messages).where(eq(messages.conversationId, conversationId));
	} catch (error) {
		throw new FetchMessagesFromDBError("Error fetching messages", { cause: (error as Error).message });
	}
}

export async function addMessageToDB(payload: ISendMessageSchema) {
	try {
		const insertPayload = {
			messageId: `msg_${generateNanoId()}`,
			conversationId: payload.conversationId,
			senderId: payload.userId,
			text: payload.message,
			createdAt: new Date(),
		};
		await db.insert(messages).values(insertPayload);
		return insertPayload;
	} catch (error) {
		throw new AddMessageToDBError("Error adding message to the database", { cause: (error as Error).message });
	}
}
