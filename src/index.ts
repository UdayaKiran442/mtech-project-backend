import { Hono } from "hono";
import { cors } from "hono/cors";
import { Server as BunEngine } from "@socket.io/bun-engine";
import type { WebSocketData } from "@socket.io/bun-engine";
import { Server } from "socket.io";

import v1Router from "./routes";
import { convertTextToChunkService, extractTextFromS3FileService } from "./services/langchain.service";
import { convertTextToEmbeddingsService } from "./services/python.service";
import { upsertEmbeddingsService } from "./services/pinecone.service";

import { generateNanoId } from "./utils/nano.utils";

const app = new Hono();

const io = new Server({
	path: "/socket.io/",
	cors: {
		origin: "http://localhost:3001",
		credentials: true,
		methods: ["GET", "POST"],
	},
});

const engine = new BunEngine({
	path: "/socket.io/",
});

io.bind(engine);

io.on("connection", (socket) => {
	console.log("a user connected", socket.id);
});

app.get("/", (c) => {
	return c.text("Hello Hono! From CI CD pipeline");
});

app.get("/test1", (c) => {
	const nanoid = `msg_${generateNanoId()}`;
	return c.text(`Hello World! ${nanoid}`);
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

const { websocket } = engine.handler();

export default {
	port: 3000,
	idleTimeout: 30, // must be greater than the "pingInterval" option of the engine, which defaults to 25 seconds

	fetch(req: Request, server: Bun.Server<WebSocketData>) {
		const url = new URL(req.url);

		if (url.pathname === "/socket.io/") {
			return engine.handleRequest(req, server);
		} else {
			return app.fetch(req, server);
		}
	},

	websocket,
};
