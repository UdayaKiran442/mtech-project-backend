import { CheckIfRepoParsedError, CheckIfRepoParsedInDBError, GetAccessibleRepositoriesError, GetRepositoryBranchesError } from "../exceptions/github.exceptions";
import { GetAccessibleRepositoriesServiceError, GetRepositoryBranchesServiceError, GetRepositoryContentServiceError } from "../exceptions/octokit.exceptions";
import { checkIfRepoParsedInDB } from "../repository/github.repository";
import type { IAccessibleRepositoriesSchema, ICheckIfRepoParsedSchema, IGetRepositoryBranchesSchema, IParsedRepositorySchema } from "../routes/v1/github.route";
import { getAccessibleRepositories, getRepositoryBranchesService, getRepositoryContentService } from "../services/octokit.service";

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
		if (error instanceof GetRepositoryContentServiceError) {
			throw error;
		}
	}
}

const allFiles: string[] = [];

export async function traverseDirectory(payload: IParsedRepositorySchema, path?: string) {
	try {
		// biome-ignore lint/suspicious/noImplicitAnyLet: <TODO: write type for content>
		let contents;
		if (path) {
			contents = await getRepositoryContentService(
				{
					branch: payload.branch,
					owner: payload.owner,
					repo: payload.repoName,
					installationId: payload.installationId,
				},
				path,
			);
		} else {
			contents = await getRepositoryContentService({
				branch: payload.branch,
				owner: payload.owner,
				repo: payload.repoName,
				installationId: payload.installationId,
			});
		}
		for (const item of contents) {
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
				continue;
			}

			if (item.type === "dir") {
				await traverseDirectory(payload, item.path);
			}

			if (item.type === "file") {
				console.log(item.path);
				allFiles.push(item.path);
			}
		}
		return allFiles;
	} catch (error) {
		if (error instanceof GetRepositoryContentServiceError) {
			throw error;
		}
	}
}
