import pLimit from "p-limit";
import { CheckIfRepoParsedError, CheckIfRepoParsedInDBError, GetAccessibleRepositoriesError, GetRepositoryBranchesError, TraverseDirectoryError } from "../exceptions/github.exceptions";
import { GetAccessibleRepositoriesServiceError, GetFileContentServiceError, GetRepositoryBranchesServiceError, GetRepositoryContentServiceError } from "../exceptions/octokit.exceptions";
import { checkIfRepoParsedInDB } from "../repository/github.repository";
import type { IAccessibleRepositoriesSchema, ICheckIfRepoParsedSchema, IGetRepositoryBranchesSchema, IParsedRepositorySchema } from "../routes/v1/github.route";
import { getAccessibleRepositories, getFileContentService, getRepositoryBranchesService, getRepositoryContentService } from "../services/octokit.service";
import type { IRepoFolder } from "../types/types";
import { resolvePaths } from "../utils/path.utils";
import { upsertNodeToNeo4jService } from "../services/neo4j.service";

const limit = pLimit(10);

const transpiler = new Bun.Transpiler({
	target: "bun",
});

export async function fetchAccessibleRepositories(payload: IAccessibleRepositoriesSchema) {
	try {
		return await getAccessibleRepositories(Number(payload.installationId));
	} catch (error) {
		if (error instanceof GetAccessibleRepositoriesServiceError) {
			throw error;
		}
		throw new GetAccessibleRepositoriesError("Failed to fetch accessible repositories", {
			cause: (error as Error).message,
		});
	}
}

export async function getRepositoryBranches(payload: IGetRepositoryBranchesSchema) {
	try {
		return await getRepositoryBranchesService({
			installationId: Number(payload.installationId),
			owner: payload.owner,
			repo: payload.repo,
		});
	} catch (error) {
		if (error instanceof GetRepositoryBranchesServiceError) {
			throw error;
		}
		throw new GetRepositoryBranchesError("Failed to fetch repository branches", {
			cause: (error as Error).message,
		});
	}
}

export async function checkIfRepoParsed(payload: ICheckIfRepoParsedSchema) {
	try {
		return await checkIfRepoParsedInDB(payload);
	} catch (error) {
		if (error instanceof CheckIfRepoParsedInDBError) {
			throw error;
		}
		throw new CheckIfRepoParsedError("Failed to check if repository is parsed", {
			cause: (error as Error).message,
		});
	}
}

export async function parseRepository(payload: IParsedRepositorySchema) {
	try {
		// fetch all files in the repository
		const allFiles = await traverseDirectory(payload);
		// create a hash map to store file path and boolean value to check if the file is already parsed or not
		const fileMap: Record<string, boolean> = {};

		// for each file
		for (const filePath of allFiles) {
			if (fileMap[filePath]) {
				continue;
			}
			// fetch file content
			const fileContent = await getFileContent(
				{
					branch: payload.branch,
					owner: payload.owner,
					repoName: payload.repoName,
					installationId: payload.installationId,
					userId: payload.userId,
				},
				filePath,
			);
			if (!fileContent) {
				// throw error
				return;
			}
			// create a node in graph database for the file with label File and properties like name, path, type, content
			const query = `MERGE (f:File{name: ${fileContent.path}}) SET f.name = ${fileContent.name}, f.path = ${fileContent.path}, f.type = ${fileContent.type}, f.content = ${fileContent.content}`;
			await upsertNodeToNeo4jService(query);
			fileMap[filePath] = true;

			// extract imports and create edges between the nodes
			
		}

		return allFiles;
	} catch (error) {
		if (error instanceof GetRepositoryContentServiceError || error instanceof TraverseDirectoryError) {
			throw error;
		}
	}
}

export async function getFileContent(payload: IParsedRepositorySchema, filePath: string) {
	try {
		const fileContent = await getFileContentService({
			branch: payload.branch,
			owner: payload.owner,
			repo: payload.repoName,
			installationId: payload.installationId,
			path: filePath,
		});
		const decodedContent = Buffer.from(fileContent.content, "base64").toString("utf-8");
		const code = transpiler.transformSync(decodedContent);
		const { imports } = transpiler.scan(code);
		const fileImportRegex = /^(\.\/|\.\.\/|@\/)/;
		const filteredImports = imports.filter((imp) => fileImportRegex.test(imp.path));
		const importPaths: string[] = [];
		for (const imp of filteredImports) {
			const normalisedPath = resolvePaths("src/index.ts", imp.path);
			importPaths.push(normalisedPath);
		}
		const match = fileContent.name.match(/\.([^.]+)$/);
		const type = match ? `.${match[1]}` : "No extension found";
		return { content: code, imports: importPaths, size: fileContent.size, name: fileContent.name, path: fileContent.path, type: type };
	} catch (error) {
		if (error instanceof GetFileContentServiceError) {
			throw error;
		}
	}
}

export async function traverseDirectory(payload: IParsedRepositorySchema, path?: string): Promise<string[]> {
	try {
		const contents = path
			? await getRepositoryContentService(
					{
						branch: payload.branch,
						owner: payload.owner,
						repo: payload.repoName,
						installationId: payload.installationId,
					},
					path,
				)
			: await getRepositoryContentService({
					branch: payload.branch,
					owner: payload.owner,
					repo: payload.repoName,
					installationId: payload.installationId,
				});

		const files: string[] = [];

		const tasks = contents.map((item: IRepoFolder) =>
			limit(async () => {
				if (
					item.name === ".gitignore" ||
					item.name === "dist" ||
					item.name === "build" ||
					item.name === "package.json" ||
					item.name === "package-lock.json" ||
					item.name === "yarn.lock" ||
					item.name === "pnpm-lock.yaml" ||
					item.name === "bun.lock"
				) {
					return [];
				}

				if (item.type === "file") {
					return [item.path];
				}

				if (item.type === "dir") {
					return traverseDirectory(payload, item.path);
				}

				return [];
			}),
		);

		const results = await Promise.all(tasks);

		for (const result of results) {
			files.push(...result);
		}

		return files;
	} catch (error) {
		if (error instanceof GetRepositoryContentServiceError) {
			throw error;
		}
		throw new TraverseDirectoryError("Failed to traverse directory", { cause: (error as Error).message });
	}
}
