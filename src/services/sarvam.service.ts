import { SarvamAIClient } from "sarvamai";
import { GenerateResponseFromSarvamServiceError } from "../exceptions/sarvam.exceptions";

type ISarvamServicePayload = {
	prompt: string;
	model: "sarvam-30b" | "sarvam-105b";
	temperature: number;
};

export async function generateResponseFromSarvamService(payload: ISarvamServicePayload) {
	try {
		const client = new SarvamAIClient({
			apiSubscriptionKey: process.env.SARVAM_API_KEY,
		});
		const response = await client.chat.completions({
			model: payload.model,
			messages: [
				{
					role: "system",
					content: payload.prompt,
				},
			],
		});
		return response.choices[0].message.content;
	} catch (error) {
        throw new GenerateResponseFromSarvamServiceError("Failed to generate response from Sarvam service", { cause: error });
    }
}
