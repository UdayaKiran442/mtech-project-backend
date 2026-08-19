import { Octokit } from "@octokit/core";
import { Hono } from "hono";
import connectToNeo4j from "../../config/neo4j.config";
import { searchRepoFileInDB } from "../../repository/github.repository";
import { searchKnowledgeBaseFilesInDB } from "../../repository/knowledgeBase.repository";
import { fetchFileNodeDetailsService } from "../../services/neo4j.service";

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
	const files = result.data;
	console.log("Files in the repository:", files);
	return c.json({ message: "This is another test route", contents: result.data });
});

testRouter.get("/test3", async (c) => {
	const result = await searchRepoFileInDB({
		branch: "main",
		repoName: "dummy-repository",
		searchString: "utils",
		userId: "user_sVKE1p866Lg7EPBlyPMAG",
		workspaceId: "workspace_1",
	});
	return c.json({ message: "This is a test route for searching files in DB", result: result });
});

testRouter.get("/test4", async (c) => {
	const result = await searchKnowledgeBaseFilesInDB({
		searchString: "Sys",
		workspaceId: "ws_JyzeFS0u8rAyQsbzbV0I5",
	});
	return c.json({ message: "This is a test route for searching files in DB", result: result });
});

testRouter.get("/test5", async (c) => {
	const query = `MATCH (f:File {path: "src/index.ts"})-[:IMPORTS*]-(other:File)
RETURN other;`;
	const driver = await connectToNeo4j();
	const result = await driver.executeQuery(query);
	return c.json({ success: true, query, result });
});

testRouter.get("/test6", async (c) => {
	const result = await fetchFileNodeDetailsService("src/index.ts");
	return c.json({ success: true, result });
});

export default testRouter;
