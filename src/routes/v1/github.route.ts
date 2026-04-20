import { Hono } from "hono";
import * as arctic from "arctic";
import github from "../../config/github.config";

const githubRoute = new Hono();

githubRoute.get("/", (c) => {
	const state = arctic.generateState();
	const scopes = ["user:email", "repo"];
	const url = github.createAuthorizationURL(state, scopes);

	return c.json({ url });
});

githubRoute.get("/callback", async (c) => {
	const code = c.req.query("code");
	if (!code) {
		throw new Error("Authorization code not found in query parameters");
	}
	const tokens = await github.validateAuthorizationCode(code);
	const accessToken = tokens.accessToken();
	const githubUserResponse = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/vnd.github+json",
		},
	});
    const data = await githubUserResponse.json();
	return c.redirect(`http://localhost:3001/github-success/?${new URLSearchParams({ username: data.login, accessToken: accessToken })}`);
});

export default githubRoute;
