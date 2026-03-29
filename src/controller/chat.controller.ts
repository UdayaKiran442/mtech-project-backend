import { FetchChatMessagesError } from "../exceptions/chat.exceptions";
import { AddMemberToConversationInDBError } from "../exceptions/conversationMembers.exceptions";
import { CreateConversationInDBError, FetchConversationIdFromDBError } from "../exceptions/conversations.exceptions";
import { FetchMessagesFromDBError } from "../exceptions/messages.exceptions";
import { addMemberToConversationInDB } from "../repository/conversationMembers.repository";
import { createConversationInDB, fetchConversationIdFromDB } from "../repository/conversations.repository";
import { fetchChatMessagesFromDB } from "../repository/messages.repository";
import type { IFetchChatMessagesSchema } from "../routes/v1/chat.route";

export async function fetchChatMessages(payload: IFetchChatMessagesSchema) {
	try {
		// fetch conversation id of the user and the receiver based on type of conversation (dm or group)
		const conversationId = await fetchConversationIdFromDB(payload);

		// if conversation exists, fetch messages based on conversation id
		if (conversationId) {
			return await fetchChatMessagesFromDB(conversationId);
		}
		// else create a new conversation and members and return empty messages
		const newConversation = await createConversationInDB("dm");
		// add members to the conversation
		newConversation &&
			(await Promise.all([
				addMemberToConversationInDB({
					conversationId: newConversation.conversationId,
					userId: payload.userId,
				}),
				addMemberToConversationInDB({
					conversationId: newConversation.conversationId,
					userId: payload.receiverId,
				}),
			]));
		return [];
	} catch (error) {
		if (
			error instanceof CreateConversationInDBError ||
			error instanceof AddMemberToConversationInDBError ||
			error instanceof FetchMessagesFromDBError ||
			error instanceof FetchConversationIdFromDBError
		) {
			throw error;
		}
		throw new FetchChatMessagesError("Error fetching chat messages", { cause: (error as Error).message });
	}
}
