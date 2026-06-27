import { SearchRepoFileInDBError } from "../exceptions/github.exceptions";
import { SearchKnowledgeBaseFilesInDBError } from "../exceptions/knowledgeBase.exceptions";
import { searchRepoFileInDB } from "../repository/github.repository";
import { searchKnowledgeBaseFilesInDB } from "../repository/knowledgeBase.repository";
import type { ISearchFilesSchema } from "../routes/v1/search.route";

export async function searchFiles(payload: ISearchFilesSchema) {
	try {
		const [repoFiles, knowledgeBaseFiles] = await Promise.all([
			searchRepoFileInDB(payload),
			searchKnowledgeBaseFilesInDB({
				searchString: payload.searchString,
				workspaceId: payload.workspaceId,
			}),
		]);
		return { repoFiles, knowledgeBaseFiles };
	} catch (error) {
		if (error instanceof SearchRepoFileInDBError || error instanceof SearchKnowledgeBaseFilesInDBError) {
			throw error;
		}
        
	}
}
