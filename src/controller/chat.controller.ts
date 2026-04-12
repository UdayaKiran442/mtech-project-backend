import { io } from "../config/websockets.config";
import { FetchChatMessagesError, GetConversationIdError, SendMessageError } from "../exceptions/chat.exceptions";
import { AddMemberToConversationInDBError } from "../exceptions/conversationMembers.exceptions";
import { CreateConversationInDBError, FetchConversationIdFromDBError } from "../exceptions/conversations.exceptions";
import { AddMessageToDBError, FetchMessagesFromDBError } from "../exceptions/messages.exceptions";
import { addMemberToConversationInDB } from "../repository/conversationMembers.repository";
import { createConversationInDB, fetchConversationIdFromDB } from "../repository/conversations.repository";
import { addMessageToDB, fetchChatMessagesFromDB } from "../repository/messages.repository";
import type { IFetchChatMessagesSchema, IGetConversationIdSchema, ISendMessageSchema } from "../routes/v1/chat.route";

/**
 *
 * @param payload
 * @description This function fetches chat messages
 * @returns Array of messages
 */
export async function fetchChatMessages(payload: IFetchChatMessagesSchema) {
	try {
		return await fetchChatMessagesFromDB(payload.conversationId);
	} catch (error) {
		if (error instanceof FetchMessagesFromDBError) {
			throw error;
		}
		throw new FetchChatMessagesError("Error fetching chat messages", { cause: (error as Error).message });
	}
}

export async function sendMessage(payload: ISendMessageSchema) {
	try {
		io.on(`conversation_${payload.conversationId}`, (socket) => {
			socket.emit("message", message.text);
		});
		const message = await addMessageToDB(payload);
		return message;
	} catch (error) {
		if (error instanceof AddMessageToDBError) {
			throw error;
		}
		throw new SendMessageError("Error sending message", { cause: (error as Error).message });
	}
}

/**
 * 
 * @param payload 
 * @description 
 * - Fetch conversation id for userId and receiverId based on conversation type (dm or group)
 * - If conversation id doesn't exist, create a new conversation and add members to the conversation and return the conversation id
 * @returns conversation id 
 */
export async function getConversationId(payload: IGetConversationIdSchema) {
	try {
		// fetch conversation id of the user and the receiver based on type of conversation (dm or group)
		const conversationId = await fetchConversationIdFromDB(payload);
		// else create a new conversation and members and return empty messages
		if (!conversationId) {
			const newConversation = await createConversationInDB(payload.type);
			// add members to the conversation
			await Promise.all([
				addMemberToConversationInDB({
					conversationId: newConversation.conversationId,
					userId: payload.userId,
				}),
				addMemberToConversationInDB({
					conversationId: newConversation.conversationId,
					userId: payload.receiverId,
				}),
			]);
			return newConversation.conversationId;
		}
		return conversationId;
	} catch (error) {
		if (error instanceof FetchConversationIdFromDBError || error instanceof CreateConversationInDBError || error instanceof AddMemberToConversationInDBError) {
			throw error;
		}
		throw new GetConversationIdError("Error fetching conversation id", { cause: (error as Error).message });
	}
}
