import octokitInstance from "../config/octokit.config";
import { GetAccessibleRepositoriesServiceError } from "../exceptions/octokit.exceptions";

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
