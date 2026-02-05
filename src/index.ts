import { Hono } from "hono";
import { cors } from "hono/cors";

import v1Router from "./routes";
import { convertTextToChunkService, extractTextFromS3FileService } from "./services/langchain.service";
import { convertTextToEmbeddingsService } from "./services/python.service";
import { upsertEmbeddingsService } from "./services/pinecone.service";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.get("/test", async (c) => {
	const result = await extractTextFromS3FileService("default-workspace/MWjrgU-4L8lZoRirlMstG.pdf");
	const chunks = await convertTextToChunkService(result);
	const embeddings = await convertTextToEmbeddingsService(chunks);
	await upsertEmbeddingsService({
		vectors: embeddings.embeddings,
		metadata: { workspaceId: "test", uploadedBy: "tester" },
	});
	return c.json({ success: true });
});

app.use(
	"/*",
	cors({
		origin: ["http://localhost:3001"],
	}),
);

app.route("/v1", v1Router);

Bun.serve({
	port: 3000,
	idleTimeout: 255,
	fetch: app.fetch,
});

export default app;
