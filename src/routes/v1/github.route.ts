import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import * as arctic from "arctic";
import github from "../../config/github.config";

const githubRoute = new Hono();

// Route to initiate Github OAuth flow
githubRoute.get("/", (c) => {
	const state = arctic.generateState();
	const scopes = ["user:email", "repo"];
	const url = github.createAuthorizationURL(state, scopes);

	return c.json({ url });
});

// Callback route to handle Github OAuth response
githubRoute.get("/callback", async (c) => {
	// Extract the authorization code from the query parameters
	const code = c.req.query("code");
	if (!code) {
		throw new Error("Authorization code not found in query parameters");
	}
	// extract access token using the authorization code and fetch user details from Github API
	const tokens = await github.validateAuthorizationCode(code);
	const accessToken = tokens.accessToken();
	// Cookie is set in browser
	setCookie(c, "github_access_token", accessToken, {
		secure: false, // Set to true in production when using HTTPS
		httpOnly: true,
	});
	const githubUserResponse = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/vnd.github+json",
		},
	});
	const data = await githubUserResponse.json();
	// redirect to frontend with github username and access token as query parameters
	return c.redirect(`http://localhost:3001/github-success/?${new URLSearchParams({ username: data.login })}`);
});

export default githubRoute;
