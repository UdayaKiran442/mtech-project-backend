import octokitInstance from "../config/octokit.config";
import {
	GetAccessibleRepositoriesServiceError,
	GetFileContentServiceError,
	GetRepositoryBranchDetailsServiceError,
	GetRepositoryBranchesServiceError,
	GetRepositoryContentServiceError,
} from "../exceptions/octokit.exceptions";
import type { IRepoFileContent, IRepoFolder } from "../types/types";

/**
 * Fetches accessible repositories for a given installation ID.
 * @param installationId - The ID of the installation.
 * @returns A promise resolving to the list of accessible repositories.
 */
export async function getAccessibleRepositoriesService(installationId: number) {
	const octokit = octokitInstance(installationId);
	try {
		const response = (await octokit).request("GET /installation/repositories", {
			headers: {
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2026-03-10",
			},
		});
		return (await response).data;
	} catch (error) {
		throw new GetAccessibleRepositoriesServiceError("Failed to fetch accessible repositories from service from installed app", {
			cause: (error as Error).message,
		});
	}
}

/**
 * 
 * @param payload 
 * @returns branches
 * @description
 * - Octokit service to fetch all branches from repository
 */
export async function getRepositoryBranchesService(payload: { installationId: number; owner: string; repo: string }) {
	const octokit = octokitInstance(payload.installationId);
	try {
		const response = (await octokit).request("GET /repos/{owner}/{repo}/branches", {
			owner: payload.owner,
			repo: payload.repo,
			headers: {
				"X-GitHub-Api-Version": "2026-03-10",
				Accept: "application/vnd.github+json",
			},
		});
		return (await response).data;
	} catch (error) {
		throw new GetRepositoryBranchesServiceError("Failed to fetch repository branches from service from installed app", {
			cause: (error as Error).message,
		});
	}
}

/**
 * 
 * @param payload 
 * @returns branch details
 * @description
 * - Octokit service to fetch branch details from repository
 */
export async function getRepositoryBranchDetailsService(payload: { installationId: number; owner: string; repo: string; branch: string }) {
	const octokit = octokitInstance(payload.installationId);
	try {
		const response = (await octokit).request("GET /repos/{owner}/{repo}/branches/{branch}", {
			owner: payload.owner,
			repo: payload.repo,
			branch: payload.branch,
			headers: {
				"X-GitHub-Api-Version": "2026-03-10",
				Accept: "application/vnd.github+json",
			},
		});
		return (await response).data;
	} catch (error) {
		throw new GetRepositoryBranchDetailsServiceError("Failed to fetch repository branch details from service from installed app", {
			cause: (error as Error).message,
		});
	}
}

/**
 * 
 * @param payload 
 * @param path 
 * @returns Repository details
 * @description
 * - Octokit service to get repository directory details from the service
 * - If path is provided, fetches the content of that specific folder in the repository
 * - If path is not provided, fetches the root directory content of the repository
 */
export async function getRepositoryContentService(payload: { installationId: number; owner: string; repo: string; branch: string }, path?: string): Promise<IRepoFolder[]> {
	const octokit = octokitInstance(payload.installationId);
	try {
		if (path) {
			const response = (await octokit).request("GET /repos/{owner}/{repo}/contents/{path}", {
				owner: payload.owner,
				repo: payload.repo,
				ref: payload.branch,
				path,
				headers: {
					"X-GitHub-Api-Version": "2026-03-10",
					Accept: "application/vnd.github+json",
				},
			});
			return (await response).data as IRepoFolder[];
		}
		const response = (await octokit).request("GET /repos/{owner}/{repo}/contents", {
			owner: payload.owner,
			repo: payload.repo,
			ref: payload.branch,
			headers: {
				"X-GitHub-Api-Version": "2026-03-10",
				Accept: "application/vnd.github+json",
			},
		});
		return (await response).data as IRepoFolder[];
	} catch (error) {
		throw new GetRepositoryContentServiceError("Failed to fetch repository content from service from installed app", {
			cause: (error as Error).message,
		});
	}
}

/**
 * 
 * @param payload 
 * @returns file content
 * @description
 * - Octokit service to fetch file content from repository
 * - Fetches the content of a specific file in the repository based on the provided path
 */
export async function getFileContentService(payload: { installationId: number; owner: string; repo: string; branch: string; path: string }): Promise<IRepoFileContent> {
	try {
		const octokit = octokitInstance(payload.installationId);
		const response = (await octokit).request("GET /repos/{owner}/{repo}/contents/{path}", {
			owner: payload.owner,
			repo: payload.repo,
			ref: payload.branch,
			path: payload.path,
			headers: {
				"X-GitHub-Api-Version": "2026-03-10",
				Accept: "application/vnd.github+json",
			},
		});
		return (await response).data as IRepoFileContent;
	} catch (error) {
		throw new GetFileContentServiceError("Failed to fetch file content from service from installed app", {
			cause: (error as Error).message,
		});
	}
}
