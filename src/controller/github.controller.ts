import { GetAccessibleRepositoriesError, GetRepositoryBranchesError } from "../exceptions/github.exceptions";
import { GetAccessibleRepositoriesServiceError, GetRepositoryBranchesServiceError } from "../exceptions/octokit.exceptions";
import type { IAccessibleRepositoriesSchema, IGetRepositoryBranchesSchema } from "../routes/v1/github.route";
import { getAccessibleRepositories, getRepositoryBranchesService } from "../services/octokit.service";

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
