import pLimit from "p-limit";
import {
	AddParsedRepoToDBError,
	CheckIfRepoParsedError,
	CheckIfRepoParsedInDBError,
	GetAccessibleRepositoriesError,
	GetRepositoryBranchesError,
	ProcessFileContentError,
	TraverseDirectoryError,
} from "../exceptions/github.exceptions";
import { GetAccessibleRepositoriesServiceError, GetFileContentServiceError, GetRepositoryBranchesServiceError, GetRepositoryContentServiceError } from "../exceptions/octokit.exceptions";
import { addParsedRepoToDB, checkIfRepoParsedInDB } from "../repository/github.repository";
import type { IAccessibleRepositoriesSchema, ICheckIfRepoParsedSchema, IGetRepositoryBranchesSchema, IParsedRepositorySchema } from "../routes/v1/github.route";
import { getAccessibleRepositories, getFileContentService, getRepositoryBranchesService, getRepositoryContentService } from "../services/octokit.service";
import type { IRepoFolder } from "../types/types";
import { resolvePaths } from "../utils/path.utils";
import { queryNeo4jService } from "../services/neo4j.service";
import { QueryNeo4jServiceError } from "../exceptions/neo4j.exceptions";

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

// create a hash map to store file path and boolean value to check if the file is already parsed or not
const fileMap: Record<string, boolean> = {};

export async function parseRepository(payload: IParsedRepositorySchema) {
	try {
		// fetch all files in the repository
		const allFiles = await traverseDirectory(payload);
		console.log(`Total files found: ${allFiles.length}`);
		let index = 0;

		// for each file
		for (const filePath of allFiles) {
			console.log(`Processing file ${++index}/${allFiles.length}: ${filePath}`);
			// if the file is already parsed, skip it
			if (fileMap[filePath]) {
				continue;
			}
			// process the file content and store it in neo4j
			await processFileContent(payload, filePath);
		}
		// after processing all files, add the repository to the parsed_repos table in the database
		return await addParsedRepoToDB(payload);
	} catch (error) {
		if (
			error instanceof GetRepositoryContentServiceError ||
			error instanceof TraverseDirectoryError ||
			error instanceof QueryNeo4jServiceError ||
			error instanceof ProcessFileContentError ||
			error instanceof AddParsedRepoToDBError
		) {
			throw error;
		}
	} finally {
		// clear the file map after processing the repository
		for (const key in fileMap) {
			delete fileMap[key];
		}
	}
}

export async function processFileContent(payload: IParsedRepositorySchema, filePath: string) {
	try {
		console.log(`Processing content for file: ${filePath}`);
		// get details of the file, code, imports, etc.
		const fileContent = await getFileContent(payload, filePath);
		console.log(`File content for ${filePath} fetched successfully: ${fileContent}`);
		if (!fileContent) {
			// throw error
			return;
		}

		// query to create node for the file
		const query = `MERGE (f:File {path: $path}) SET f.path = $path, f.name = $name, f.type = $type, f.content = $content`;
		// execute the query to create node for the file in neo4j
		await queryNeo4jService(query, {
			path: fileContent.path,
			name: fileContent.name,
			type: fileContent.type,
			content: fileContent.content,
		});
		// add file path to the map with value true to indicate that the file is parsed
		fileMap[fileContent.path] = true;
		console.log(`File content for ${filePath} processed and stored in Neo4j. Processing imports...`);
		// check if file has imports, if yes, process each import
		if (fileContent.imports.length > 0) {
			console.log(`File ${filePath} has ${fileContent.imports.length} imports. Processing imports...`);
			// for each import
			for (const imp of fileContent.imports) {
				console.log(`Processing import: ${imp} for file: ${filePath}`);
				// check if the import is already parsed, if yes, create relationship in neo4j and skip to next import
				if (fileMap[imp]) {
					// create relationship in neo4j between the file and the imported file
					const edgeQuery = `MATCH (f1:File {path: $file1Path}), (f2:File {path: $file2Path}) MERGE (f1)-[:IMPORTS]->(f2)`;
					await queryNeo4jService(edgeQuery, {
						file1Path: fileContent.path,
						file2Path: imp,
					});
				} else {
					// if the import is not parsed
					const content = await getFileContent(payload, imp);
					console.log(`File content for import ${imp} fetched successfully: ${content}`);
					if (!content) {
						continue;
					}
					// create node for the imported file in neo4j
					const query = `MERGE (f:File{path: $path}) SET f.name = $name, f.path = $path, f.type = $type, f.content = $content`;
					await queryNeo4jService(query, {
						path: content.path,
						name: content.name,
						type: content.type,
						content: content.content,
					});
					// add import file path to the map with value true to indicate that the file is parsed
					fileMap[content.path] = true;
					// create relationship in neo4j between the file and the imported file
					const edgeQuery = `MATCH (f1:File {path: $file1Path}), (f2:File {path: $file2Path}) MERGE (f1)-[:IMPORTS]->(f2)`;
					await queryNeo4jService(edgeQuery, {
						file1Path: fileContent.path,
						file2Path: content.path,
					});
					// if the imported file has imports, process them as well recursively
					if (content.imports.length > 0) {
						console.log(`Processing imports for file: ${imp}`);
						console.log(`File ${imp} has ${content.imports.length} imports. Processing imports...`);
						await processFileContent(payload, imp);
					}
				}
			}
		}
	} catch (error) {
		if (error instanceof GetFileContentServiceError || error instanceof QueryNeo4jServiceError) {
			throw error;
		}
		throw new ProcessFileContentError(`Failed to process file content for file ${filePath}`, { cause: (error as Error).message });
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
		const code = transpiler.transformSync(decodedContent, "ts");
		const { imports } = transpiler.scan(code);
		const fileImportRegex = /^(\.\/|\.\.\/|@\/)/;
		const filteredImports = imports.length > 0 ? imports.filter((imp) => fileImportRegex.test(imp.path)) : [];
		const importPaths: string[] = [];
		if (filteredImports.length > 0) {
			for (const imp of filteredImports) {
				const normalisedPath = resolvePaths(filePath, imp.path);
				importPaths.push(normalisedPath);
			}
		}
		const match = fileContent.name.match(/\.([^.]+)$/);
		const type = match ? match[1] : "No extension found";
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
					item.name === "bun.lock" ||
					item.name.includes(".md") ||
					item.name.includes(".json") ||
					item.name.includes(".yml") ||
					item.name.includes(".yaml") ||
					item.name.includes(".env")
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
