import { FUNCTION_DECLARATION } from "../constants/subModuleType.constants";
import { traverseDirectory } from "../controller/github.controller";
import type { IRepoContext, ISubModule } from "../types/types";
import { fetchFileNode, fetchFunctionDeclarationsFromNode } from "./treesitterNodes.utils";

export async function buildModuleGraphV2(payload: { repoContext: IRepoContext; userId: string; workspaceId: string }) {
	try {
		const subModules: ISubModule[] = [];
		const allFiles = await traverseDirectory({
			branch: payload.repoContext.branch,
			owner: payload.repoContext.owner,
			repoName: payload.repoContext.repo,
			installationId: payload.repoContext.installationId.toString(),
			userId: payload.userId,
			workspaceId: payload.workspaceId,
		});
		for (const filePath of allFiles) {
            console.log(`Processing file: ${filePath}`);
			const { node, decodedString } = await fetchFileNode({
				repoContext: payload.repoContext,
				filePath,
			});

			const functionDeclarations = node.descendantsOfType(FUNCTION_DECLARATION);
            if (functionDeclarations.length === 0) {
                continue; // Skip files without function declarations
            }
			const codeBlocks = await fetchFunctionDeclarationsFromNode({
				decodedString,
				functionDeclarations,
				resolvedPath: filePath,
			});

			subModules.push(...codeBlocks);
		}

		return subModules;
	} catch (error) {
		throw new Error(`Failed to build module graph: ${(error as Error).message}`);
	}
}

// // check for import statements in the node
// const importNodes = node.descendantsOfType("import_statement");
// // extract and normalise the import paths from import node
// const importPaths = fetchImportPathsFromNode({ importNodes });
// const resolvedImportPaths: string[] = [];
// for (const importPath of importPaths) {
// 	// resolve the import path to an absolute path
// 	resolvedImportPaths.push(resolvePaths(filePath, importPath));
// }
