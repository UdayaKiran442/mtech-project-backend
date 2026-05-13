import octokitInstance from "../config/octokit.config";
import { GetAccessibleRepositoriesServiceError, GetRepositoryBranchDetailsServiceError, GetRepositoryBranchesServiceError, GetRepositoryContentServiceError } from "../exceptions/octokit.exceptions";

export async function getAccessibleRepositories(installationId: number) {
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

export async function getRepositoryContentService(payload: { installationId: number; owner: string; repo: string; branch: string }) {
	const octokit = octokitInstance(payload.installationId);
	try {
		const response = (await octokit).request("GET /repos/{owner}/{repo}/contents", {
			owner: payload.owner,
			repo: payload.repo,
			ref: payload.branch,
			headers: {
				"X-GitHub-Api-Version": "2026-03-10",
				Accept: "application/vnd.github+json",
			},
		});
		return (await response).data;
	} catch (error) {
		throw new GetRepositoryContentServiceError("Failed to fetch repository content from service from installed app", {
			cause: (error as Error).message,
		});
	}
}
