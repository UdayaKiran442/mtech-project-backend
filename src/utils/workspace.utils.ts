import pLimit from "p-limit"; // ← Best option
import { convertTextToEmbeddingsService } from "../services/python.service";
import { upsertEmbeddingsService } from "../services/pinecone.service";
import { ConvertTextToChunkServiceError, ConvertTextToEmbeddingsServiceError, UpsertEmbeddingsServiceError } from "../exceptions/service.exceptions";

export async function processChunksInParallel(textChunks: string[], payload: any) {
	try {
		const limit = pLimit(10);

		const promises = textChunks.map((chunk) =>
			limit(async () => {
				// 1. Generate embeddings
				const embeddings = await convertTextToEmbeddingsService(chunk);

				// 2. Upsert to vector + relational DB
				await upsertEmbeddingsService({
					metadata: {
						workspaceId: payload.workspaceId,
						uploadedBy: payload.uploadedBy,
						fileUrl: payload.fileUrl,
						textChunk: chunk,
					},
					vectors: embeddings.embeddings,
					index: payload.index,
				});

				return chunk; // optional
			}),
		);

		await Promise.all(promises);
	} catch (error) {
		if (error instanceof ConvertTextToChunkServiceError || error instanceof ConvertTextToEmbeddingsServiceError || error instanceof UpsertEmbeddingsServiceError) {
			throw error;
		}
	}
}
