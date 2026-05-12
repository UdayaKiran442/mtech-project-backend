import { GetAccessibleRepositoriesError } from "../exceptions/github.exceptions";
import { GetAccessibleRepositoriesServiceError } from "../exceptions/octokit.exceptions";
import type { IAccessibleRepositoriesSchema } from "../routes/v1/github.route";
import { getAccessibleRepositories } from "../services/octokit.service";

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
