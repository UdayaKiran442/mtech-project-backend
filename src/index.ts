import { Hono } from "hono";
import { cors } from "hono/cors";

import v1Router from "./routes";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello Hono!");
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
