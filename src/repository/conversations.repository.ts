import { sql } from "drizzle-orm";
import type { IGetConversationIdSchema } from "../routes/v1/chat.route";
import db from "./db";
import { generateNanoId } from "../utils/nano.utils";
import { conversations } from "./schema";
import { CreateConversationInDBError, FetchConversationIdFromDBError } from "../exceptions/conversations.exceptions";

// Function to fetch conversation ID from the database based on user id and receiver id
export async function fetchConversationIdFromDB(payload: IGetConversationIdSchema) {
	try {
		const query = await db.execute(sql`SELECT c.conversation_id
            FROM conversations c
            JOIN conversation_members m1 ON c.conversation_id = m1.conversation_id
            JOIN conversation_members m2 ON c.conversation_id = m2.conversation_id
            WHERE c.type = 'dm'
            AND m1.user_id = ${payload.userId}
            AND m2.user_id = ${payload.receiverId}
        `);
		return query.rows[0]?.conversation_id as string | undefined;
	} catch (error) {
		throw new FetchConversationIdFromDBError("Error fetching conversation id from DB", { cause: (error as Error).message });
	}
}

// Function to create a conversation in the database
export async function createConversationInDB(conversationType: string) {
	try {
		const insertPayload = {
			conversationId: `conv_${generateNanoId()}`,
			type: conversationType,
			createdAt: new Date(),
		};
		await db.insert(conversations).values(insertPayload);
		return insertPayload;
	} catch (error) {
		throw new CreateConversationInDBError("Failed to create conversation in DB", { cause: (error as Error).message });
	}
}
