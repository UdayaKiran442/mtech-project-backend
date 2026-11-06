import { Octokit } from "@octokit/core";
import { Hono } from "hono";
import connectToNeo4j from "../../config/neo4j.config";
import { traverseDirectory } from "../../controller/github.controller";
import { searchRepoFileInDB } from "../../repository/github.repository";
import { searchKnowledgeBaseFilesInDB } from "../../repository/knowledgeBase.repository";
import { fetchFileNodeDetailsService } from "../../services/neo4j.service";
import { resolvePaths } from "../../utils/path.utils";
import { fetchFileNode, fetchFunctionCallsFromNode, fetchImportPathsFromNode, fetchImportsFromNode } from "../../utils/treesitterNodes.utils";
import { buildSubModules } from "../../utils/treesitterV2.utils";

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

testRouter.get("/test7", async (c) => {
	const result = await buildSubModules({
		repoContext: {
			branch: "main",
			owner: "UdayaKiran442",
			repo: "dummy-repository",
			installationId: 131321944,
		},
		userId: "erf",
		workspaceId: "workspace_1",
	});
	return c.json({ result });
});

testRouter.get("/test8", async (c) => {
	const result = await traverseDirectory({
		branch: "main",
		owner: "UdayaKiran442",
		repoName: "dummy-repository",
		installationId: "131321944",
		userId: "erf",
		workspaceId: "workspace_1",
	});
	return c.json({ result });
});

testRouter.get("/test9", async (c) => {
	const { node, decodedString } = await fetchFileNode({
		repoContext: {
			branch: "main",
			owner: "UdayaKiran442",
			repo: "dummy-repository",
			installationId: 131321944,
		},
		filePath: "src/index.ts",
	});
	const functionCalls = node.descendantsOfType("call_expression");
	const result = await fetchFunctionCallsFromNode({
		decodedString,
		filePath: "src/index.ts",
		functionCalls,
	});
	const importNodes = node.descendantsOfType("import_statement");
	const imports = fetchImportsFromNode({
		importNodes,
	});
	const importPaths = fetchImportPathsFromNode({
		importNodes,
	});
	type ResolvedImport = {
		functionName: string;
		resolvedPath: string;
	};

	const resolvedImportPaths: ResolvedImport[] = [];

	importPaths.forEach((importPath, i) => {
		// "import { add, sub as minus } from './utils'" -> "add, sub as minus"
		const namedImports = imports[i].match(/\{([^}]*)\}/)?.[1] ?? "";
		// "import foo from './x'" -> default import
		const defaultImport = imports[i].match(/^import\s+([A-Za-z_$][\w$]*)/)?.[1];

		const functionNames = [
			...(defaultImport ? [defaultImport] : []),
			...namedImports
				.split(",")
				.map((name) => name.trim())
				.filter(Boolean)
				// for "sub as minus", the local name used in calls is "minus"
				// biome-ignore lint/style/noNonNullAssertion: <>
				.map((name) => name.split(/\s+as\s+/).pop()!),
		];

		const resolvedPath = resolvePaths("src/index.ts", importPath);

		for (const functionName of functionNames) {
			resolvedImportPaths.push({ functionName, resolvedPath });
		}
	});
	const finalResult = result.filter((r) => resolvedImportPaths.find((impPath) => impPath.functionName === r.name));

	return c.json({ finalResult, resolvedImportPaths });
});

export default testRouter;
