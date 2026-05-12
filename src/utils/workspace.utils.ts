import pLimit from "p-limit"; 
import { convertTextToEmbeddingsService } from "../services/python.service";
import { upsertEmbeddingsService } from "../services/pinecone.service";
import { ConvertTextToChunkServiceError, ConvertTextToEmbeddingsServiceError, UpsertEmbeddingsServiceError } from "../exceptions/service.exceptions";
import type { IAddKnowledgeSchema } from "../routes/v1/workspace.route";

export async function processChunksInParallel(textChunks: string[], payload: IAddKnowledgeSchema) {
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

				return chunk; 
			}),
		);

		await Promise.all(promises);
	} catch (error) {
		if (error instanceof ConvertTextToChunkServiceError || error instanceof ConvertTextToEmbeddingsServiceError || error instanceof UpsertEmbeddingsServiceError) {
			throw error;
		}
	}
}
