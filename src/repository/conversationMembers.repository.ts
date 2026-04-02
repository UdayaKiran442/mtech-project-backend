import { AddMemberToConversationInDBError } from "../exceptions/conversationMembers.exceptions";
import db from "./db";
import { conversationMembers } from "./schema";

// Function to add a member to a conversation in the database
export async function addMemberToConversationInDB(payload: { conversationId: string; userId: string }) {
	try {
		const insertPayload = {
			conversationId: payload.conversationId,
			userId: payload.userId,
			joinedAt: new Date(),
		};
		await db.insert(conversationMembers).values(insertPayload);
		return insertPayload;
	} catch (error) {
		throw new AddMemberToConversationInDBError("Failed to add member to conversation", { cause: (error as Error).message });
	}
}
