import type { IRepoContext, ISubModule } from "../types/types";
import { resolvePaths } from "./path.utils";
import { fetchFileNode, fetchFunctionDeclarationsFromNode, fetchImportPathsFromNode } from "./treesitterNodes.utils";

export async function buildModuleGraphV2(payload: { repoContext: IRepoContext; entryPath: string }) {
	try {
		const subModules: ISubModule[] = [];
		const { node } = await fetchFileNode({
			repoContext: payload.repoContext,
			filePath: payload.entryPath,
		});
		// check for import statements in the node
		const importNodes = node.descendantsOfType("import_statement");
		// extract and normalise the import paths from import node
		const importPaths = fetchImportPathsFromNode({ importNodes });
		const resolvedImportPaths: string[] = [];
		for (const importPath of importPaths) {
			// resolve the import path to an absolute path
			resolvedImportPaths.push(resolvePaths(payload.entryPath, importPath));
		}
		// for each resolved path, extract sub modules
		for (const resolvedPath of resolvedImportPaths) {
			console.log(`Processing resolved path: ${resolvedPath}`);
			// extract function_declaration node
			const { node, decodedString } = await fetchFileNode({
				repoContext: payload.repoContext,
				filePath: resolvedPath,
			});
			const functionDeclarations = node.descendantsOfType("function_declaration");
			const codeBlocks = await fetchFunctionDeclarationsFromNode({
				decodedString,
				functionDeclarations,
				resolvedPath,
			});
			subModules.push(...codeBlocks);
		}
		return subModules;
	} catch (error) {
		throw new Error(`Failed to build module graph: ${(error as Error).message}`);
	}
}
