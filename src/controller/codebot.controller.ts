/** biome-ignore-all lint/complexity/useLiteralKeys: <""> */
import {
	AddChatbotMessageToDBError,
	CreateCodebotChatError,
	CreateCodebotChatInDBError,
	FetchCodebotChatByIdFromDBError,
	FetchUserCodebotChatsError,
	FetchUserCodebotChatsFromDBError,
	QueryCodebotError,
	UpdateCodebotChatNameError,
	UpdateCodebotChatNameInDBError,
} from "../exceptions/codebot.exceptions";
import { NotFoundError } from "../exceptions/common.exceptions";
import { FetchFileImportsServiceError, FetchFileNodeDetailsServiceError } from "../exceptions/neo4j.exceptions";
import { GenerateResponseFromSarvamServiceError } from "../exceptions/sarvam.exceptions";
import { addChatbotMessageToDB, createCodebotChatInDB, fetchCodebotChatByIdFromDB, fetchUserCodebotChatsFromDB, updateCodebotChatNameInDB } from "../repository/codebot.repository";
import type { ICreateCodebotChatSchema, IFetchCodebotChatsSchema, IQueryCodebotSchema, IUpdateCodebotChatNameSchema } from "../routes/v1/codebot.route";
import { fetchFileImportsService, fetchFileNodeDetailsService } from "../services/neo4j.service";
import { generateResponseFromSarvamService } from "../services/sarvam.service";

export async function queryCodebot(payload: IQueryCodebotSchema) {
	try {
		let codeRecords: Array<{ type: "repo"; path: string; context: string }> = [];
		const selectedPaths = new Set(payload.selectedFiles.map((file) => file.path));
		const skippedPaths = new Set<string>();
		for (const file of payload.selectedFiles) {
			if (skippedPaths.has(file.path)) {
				console.log(`Skipping file ${file.path} as it has already been processed`);
				continue; // Skip this file as it has already been processed
			}
			if (file.type === "repo") {
				// fetch repo context here
				skippedPaths.add(file.path); // Mark the current file as processed
				const result = await fetchFileImportsService(file.path);
				// Fetch current file path node from Neo4j and push context to codeRecords array
				const currentFileNode = await fetchFileNodeDetailsService(file.path);
				if (!currentFileNode || currentFileNode.records.length === 0) {
					throw new QueryCodebotError(`No data found for file: ${file.path}`);
				}
				codeRecords.push({
					type: "repo",
					path: file.path,
					context: currentFileNode.records[0]["_fields"][0].properties.content,
				});
				console.log(`Fetched data for file ${file.path}:`, result?.records.length);
				if (!result || !result.records || result.records.length === 0) {
					throw new QueryCodebotError(`No data found for file: ${file.path}`);
				}

				// if there is another file in selectedFiles, check if it is imported by the current file, if yes, then skip that file in the loop
				for (const record of result.records) {
					codeRecords.push({
						type: "repo",
						path: record["_fields"][0].properties.path,
						context: record["_fields"][0].properties.content,
					});
					skippedPaths.add(record["_fields"][0].properties.path);
				}
			}
			if (file.type === "knowledgeBase") {
				// fetch knowledge base context here
			}
		}
		if (payload.selectedFiles.length > 1) {
			// filter out common file paths in codeRecords array and selectedPaths set
			codeRecords = codeRecords.filter((record) => selectedPaths.has(record.path));
		}

		const prompt = `You are a code assistant. You have been given the following code context from a user's repository:\n\n${codeRecords.map((record) => `File Path: ${record.path}\nContext:\n${record.context}\n`).join("\n")}\n\nThe user has asked the following question:\n\n${payload.query}\n\nPlease provide a detailed answer based on the provided code context. If the context is insufficient, indicate that more information is needed.`;
		const result = await generateResponseFromSarvamService({
			prompt,
			model: "sarvam-105b",
			temperature: 0.7,
		});
		if (!result) {
			throw new QueryCodebotError("No response received from Sarvam service");
		}
		// store the result in database
		const newChatbotMessage = await addChatbotMessageToDB({
			codebotChatId: payload.codebotChatId,
			prompt: payload.query,
			response: result,
		});

		return newChatbotMessage;
	} catch (error) {
		if (
			error instanceof QueryCodebotError ||
			error instanceof AddChatbotMessageToDBError ||
			error instanceof GenerateResponseFromSarvamServiceError ||
			error instanceof FetchFileImportsServiceError ||
			error instanceof FetchFileNodeDetailsServiceError
		) {
			throw error;
		}
		throw new QueryCodebotError("Failed to query codebot", { cause: (error as Error).message });
	}
}

export async function createCodebotChat(payload: ICreateCodebotChatSchema) {
	try {
		return await createCodebotChatInDB(payload);
	} catch (error) {
		if (error instanceof CreateCodebotChatInDBError) {
			throw error;
		}
		throw new CreateCodebotChatError("Failed to create codebot chat", { cause: (error as Error).message });
	}
}

export async function fetchUserCodebotChats(payload: IFetchCodebotChatsSchema) {
	try {
		return await fetchUserCodebotChatsFromDB(payload);
	} catch (error) {
		if (error instanceof FetchUserCodebotChatsFromDBError) {
			throw error;
		}
		throw new FetchUserCodebotChatsError("Failed to fetch user codebot chats", { cause: (error as Error).message });
	}
}

export async function updateCodebotChatName(payload: IUpdateCodebotChatNameSchema) {
	try {
		const codebotChat = await fetchCodebotChatByIdFromDB(payload.codebotChatId);
		if (!codebotChat || codebotChat.length === 0) {
			throw new NotFoundError(`Codebot chat with id ${payload.codebotChatId} not found`);
		}
		await updateCodebotChatNameInDB(payload);
	} catch (error) {
		if (error instanceof FetchCodebotChatByIdFromDBError || error instanceof UpdateCodebotChatNameInDBError || error instanceof NotFoundError) {
			throw error;
		}
		throw new UpdateCodebotChatNameError("Failed to update codebot chat name", { cause: (error as Error).message });
	}
}
