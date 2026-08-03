import { QueryCodebotError } from "../exceptions/codebot.exceptions";
import type { IQueryCodebotSchema } from "../routes/v1/codebot.route";

export async function queryCodebot(payload: IQueryCodebotSchema) {
	try {
		for (const file of payload.selectedFiles) {
			if (file.type === "repo") {
				// fetch repo context here
			}
			if (file.type === "knowledgeBase") {
				// fetch knowledge base context here
			}
		}
	} catch (error) {
		throw new QueryCodebotError("Failed to query codebot", { cause: (error as Error).message });
	}
}
