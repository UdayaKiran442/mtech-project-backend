import { Hono } from "hono";

import v1Router from "./routes";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.route("/v1", v1Router);

Bun.serve({
	port: 3000,
	idleTimeout: 60,
	fetch() {
		// Your request handling logic here
		return new Response("Hello Bun!");
	},
});

export default app;
