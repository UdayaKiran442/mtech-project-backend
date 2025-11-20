import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

Bun.serve({
	port: 3000,
	idleTimeout: 60,
	fetch() {
		// Your request handling logic here
		return new Response("Hello Bun!");
	},
});

export default app;
