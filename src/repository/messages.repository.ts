import { eq } from "drizzle-orm";
import db from "./db";
import { messages } from "./schema";
import { FetchMessagesFromDBError } from "../exceptions/messages.exceptions";

// Function to fetch chat messages from the database based on conversation id
export async function fetchChatMessagesFromDB(conversationId: string) {
	try {
		return await db.select().from(messages).where(eq(messages.conversationId, conversationId));
	} catch (error) {
		throw new FetchMessagesFromDBError("Error fetching messages", { cause: (error as Error).message });
	}
}
