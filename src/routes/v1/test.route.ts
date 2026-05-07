import { Hono } from "hono";
import { Octokit } from "@octokit/core";

const testRouter = new Hono();

const accessToken = "";

const octokit = new Octokit({
	auth: accessToken,
});

testRouter.get("/test1", async (c) => {
	const accessToken = "";
	const reposUrl = "https://api.github.com/users/UdayaKiran442/repos";
	const response = await fetch(reposUrl, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/vnd.github+json",
		},
	});
	const data = await response.json();
	return c.json({ message: "This is a test route", repos: data });
});

testRouter.get("/test2", async (c) => {
	const result = await octokit.request("GET /repos/{owner}/{repo}/contents", {
		owner: "UdayaKiran442",
		repo: "backend_interviewlm",
		headers: {
			"X-GitHub-Api-Version": "2026-03-10",
		},
	});
    const files = result.data
    console.log("Files in the repository:", files);
    return c.json({ message: "This is another test route", contents: result.data });
});

export default testRouter;
