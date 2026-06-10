import { Hono } from "hono";
import { cors } from "hono/cors";

import v1Router from "./routes";

import { generateNanoId } from "./utils/nano.utils";
import engine from "./config/websocket.config";
import type { WebSocketData } from "@socket.io/bun-engine";
import { getRepositoryContentService } from "./services/octokit.service";
import connectToNeo4j from "./config/neo4j.config";
import { getFileContent } from "./controller/github.controller";
import { queryNeo4jService } from "./services/neo4j.service";

const app = new Hono();

app.get("/", async (c) => {
	const branchDetails = await getRepositoryContentService(
		{
			branch: "main",
			owner: "UdayaKiran442",
			repo: "dummy-repository",
			installationId: 131321944,
		},
		"src/index.ts",
	);
	console.log(branchDetails);
	return c.json({ success: true, branchDetails });
});

app.get("/test3", async (c) => {
	const fileArchitecture = await getRepositoryContentService({
		branch: "main",
		owner: "UdayaKiran442",
		repo: "dummy-repository",
		installationId: 131321944,
	});
	return c.json({ fileArchitecture });
});

app.get("/test2", async (c) => {
	const branchDetails = await getRepositoryContentService({
		branch: "main",
		owner: "UdayaKiran442",
		repo: "dummy-repository",
		installationId: 131321944,
	});
	return c.json({ success: true, branchDetails });
});

app.get("/test1", (c) => {
	const nanoid = `msg_${generateNanoId()}`;
	return c.text(`Hello World! ${nanoid}`);
});

app.get("/test4", async (c) => {
	const fileContent = await getFileContent(
		{
			branch: "main",
			owner: "UdayaKiran442",
			repoName: "dummy-repository",
			installationId: 131321944,
			userId: "erf",
		},
		"src/utls/utils.ts",
	);

	return c.json({ success: true, fileContent });
});

app.get("/test5", async (c) => {
	const query = `MERGE (f:File {path: $path}) SET f.path = $path, f.fileName = $name, f.type = $type, f.content = $content`;
	await queryNeo4jService(query, {
		path: "src/controller/index.ts",
		name: "index.ts",
		type: "ts",
		content: "console.log('Hello, Neo4j controller!')",
	});
	return c.json({ success: true, message: "File content stored in Neo4j successfully" });
});


app.get("/neo4j-health-check", async (c) => {
	const driver = await connectToNeo4j();
	if (!driver) {
		return c.text(`Failed to connect to Neo4j database.`);
	}
	const query = driver.session().run("RETURN 'Hello, Neo4j!' AS message");
	const result = await query;
	const message = result.records[0].get("message");
	return c.text(`Hello World! Neo4j connection test successful. Message: ${message}`);
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
