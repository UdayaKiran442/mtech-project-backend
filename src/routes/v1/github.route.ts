import { Hono } from "hono";
import fs from "fs";
import { App } from "octokit";
import { setCookie } from "hono/cookie";
import * as arctic from "arctic";
import github from "../../config/github.config";
import { authMiddleware } from "../../middleware/authentication.middleware";
import z from "zod";
import { fetchAccessibleRepositories, getRepositoryBranches } from "../../controller/github.controller";
import { GetAccessibleRepositoriesServiceError, GetRepositoryBranchesServiceError } from "../../exceptions/octokit.exceptions";
import { GetAccessibleRepositoriesError, GetRepositoryBranchesError } from "../../exceptions/github.exceptions";

const githubRoute = new Hono();

// Route to initiate Github OAuth flow
githubRoute.get("/", (c) => {
	const state = arctic.generateState();
	const scopes = ["user:email", "repo"];
	const url = github.createAuthorizationURL(state, scopes);

	return c.json({ url });
});

githubRoute.get("/app", async (c) => {
	const private_key = fs.readFileSync("/Users/uday/Downloads/mammalio.pem", "utf-8");
	const app = new App({
		appId: "3665302",
		privateKey: private_key,
	});
	const response = await app.octokit.request("/app");
	const redirectUrl = `https://github.com/apps/${response.data.slug}/installations/new`;
	return c.json({ message: "App route accessed successfully", redirectUrl });
});

githubRoute.get("/post-install", async (c) => {
	const installation_id = c.req.query("installation_id");
	if (installation_id) {
		const private_key = fs.readFileSync("/Users/uday/Downloads/mammalio.pem", "utf-8");
		const app = new App({
			appId: "3665302",
			privateKey: private_key,
		});
		const response = (await app.octokit.request("GET /app/installations/{installation_id}", {
			installation_id: Number(installation_id),
			// biome-ignore lint/suspicious/noExplicitAny: <response.data.account has property login but TypeScript doesn't recognize it>
		})) as any;
		if (response.data.account) {
			const username = response.data.account.login;
			return c.redirect(`http://localhost:3001/github-success/?${new URLSearchParams({ username, installation_id })}`);
		}
	}
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

const AccessibleRepositoriesSchema = z.object({
	installationId: z.string(),
});

export type IAccessibleRepositoriesSchema = z.infer<typeof AccessibleRepositoriesSchema>;

githubRoute.post("/accessible-repositories", authMiddleware, async (c) => {
	try {
		const validation = AccessibleRepositoriesSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const payload = {
			...validation.data,
			userId: c.get("user").userId,
		};
		const repositories = await fetchAccessibleRepositories(payload);
		return c.json({ success: true, repositories: repositories });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 401);
		}
		if (error instanceof GetAccessibleRepositoriesServiceError || error instanceof GetAccessibleRepositoriesError) {
			return c.json({ success: false, message: error.message, error: error.cause }, 400);
		}
		return c.json({ success: false, error: "InternalServerError", message: "Something went wrong" }, 500);
	}
});

const GetRepositoryBranchesSchema = z.object({
	installationId: z.string(),
	owner: z.string(),
	repo: z.string(),
});

export type IGetRepositoryBranchesSchema = z.infer<typeof GetRepositoryBranchesSchema>;

githubRoute.post("/repository-branches", authMiddleware, async (c) => {
	try {
		const validation = GetRepositoryBranchesSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const payload = {
			...validation.data,
			userId: c.get("user").userId,
		};
		const branches = await getRepositoryBranches(payload);
		return c.json({ success: true, branches });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 401);
		}
		if (error instanceof GetRepositoryBranchesServiceError || error instanceof GetRepositoryBranchesError) {
			return c.json({ success: false, message: error.message, error: error.cause }, 400);
		}
		return c.json({ success: false, error: "InternalServerError", message: "Something went wrong" }, 500);
	}
});

export default githubRoute;
