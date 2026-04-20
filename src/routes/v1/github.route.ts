import { Hono } from "hono";
import type { Context } from "hono";
import * as arctic from "arctic";
import github from "../../config/github.config";
import type { GitContext } from "../../types/types";

const githubRoute = new Hono();

githubRoute.get("/", (c) => {
	const state = arctic.generateState();
	const scopes = ["user:email", "repo"];
	const url = github.createAuthorizationURL(state, scopes);

	return c.json({ url });
});

githubRoute.get("/callback", async (c: Context<GitContext>) => {
	const code = c.req.query("code");
	console.log("Authorization code:", code);
	if (!code) {
		throw new Error("Authorization code not found in query parameters");
	}
	const tokens = await github.validateAuthorizationCode(code);
	const accessToken = tokens.accessToken();
	console.log("Access Token:", accessToken);
	c.set("token", { accessToken });
	const githubUserResponse = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/vnd.github+json",
		},
	});
    const data = await githubUserResponse.json();
	console.log("GitHub User Response Status:", data);
	return c.redirect(`http://localhost:3001/github-success/?${new URLSearchParams({ username: data.login })}`);
});

export default githubRoute;
