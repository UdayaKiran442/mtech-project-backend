import { Hono } from "hono";
import { cors } from "hono/cors";

import v1Router from "./routes";

import { generateNanoId } from "./utils/nano.utils";
import engine from "./config/websocket.config";
import type { WebSocketData } from "@socket.io/bun-engine";
import { getRepositoryBranchDetailsService, getRepositoryContentService } from "./services/octokit.service";

const app = new Hono();

app.get("/", async (c) => {
	const branchDetails = await getRepositoryBranchDetailsService({
		branch: "main",
		owner: "UdayaKiran442",
		repo: "dummy-repository",
		installationId: 131321944,
	});
	return c.json({ success: true, branchDetails });
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
