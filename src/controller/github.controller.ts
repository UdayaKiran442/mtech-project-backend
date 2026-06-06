import pLimit from "p-limit";
import { CheckIfRepoParsedError, CheckIfRepoParsedInDBError, GetAccessibleRepositoriesError, GetRepositoryBranchesError, TraverseDirectoryError } from "../exceptions/github.exceptions";
import { GetAccessibleRepositoriesServiceError, GetRepositoryBranchesServiceError, GetRepositoryContentServiceError } from "../exceptions/octokit.exceptions";
import { checkIfRepoParsedInDB } from "../repository/github.repository";
import type { IAccessibleRepositoriesSchema, ICheckIfRepoParsedSchema, IGetRepositoryBranchesSchema, IParsedRepositorySchema } from "../routes/v1/github.route";
import { getAccessibleRepositories, getRepositoryBranchesService, getRepositoryContentService } from "../services/octokit.service";
import { IRepoFile } from "../types/types";

const limit = pLimit(10);

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

		// create nodes of all files along with their properties

		// create edges between the nodes based on the relationships between the files

		return allFiles;
	} catch (error) {
		if (error instanceof GetRepositoryContentServiceError || error instanceof TraverseDirectoryError) {
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

		const tasks = contents.map((item: IRepoFile) =>
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
