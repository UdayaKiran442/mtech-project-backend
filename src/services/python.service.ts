import { ConvertTextToEmbeddingsServiceError } from "../exceptions/service.exceptions";

export async function convertTextToEmbeddingsService(sentence: string) {
	try {
		const response = await fetch("http://127.0.0.1:8000/text/embeddings", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({sentence}),
		});
		return await response.json();
	} catch (error) {
		throw new ConvertTextToEmbeddingsServiceError("Failed to convert text to embeddings", { cause: (error as Error).message });
	}
}
