import { CALL_EXPRESSION, FUNCTION_DECLARATION, IMPORT_STATEMENT } from "../constants/subModuleType.constants";
import { traverseDirectory } from "../controller/github.controller";
import type { IRepoContext, ISubModule } from "../types/types";
import { resolvePaths } from "./path.utils";
import { fetchFileNode, fetchFunctionCallsFromNode, fetchFunctionDeclarationsFromNode, fetchImportPathsFromNode, fetchImportsFromNode } from "./treesitterNodes.utils";

type ResolvedImport = {
	functionName: string;
	declaredFilePath: string;
	calledFilePath: string;
};

export async function buildSubModules(payload: { repoContext: IRepoContext; userId: string; workspaceId: string }) {
	try {
		const subModules: ISubModule[] = [];
		const resolvedImportPaths: ResolvedImport[] = [];
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
			// TODO: handle case when a function is called in a function declaration code block

			subModules.push(...codeBlocks);
		}

		for (const filePath of allFiles) {
			const { node, decodedString } = await fetchFileNode({
				repoContext: payload.repoContext,
				filePath,
			});
			const functionCalls = node.descendantsOfType(CALL_EXPRESSION);
			if (functionCalls.length === 0) {
				continue;
			}
			const result = await fetchFunctionCallsFromNode({
				decodedString,
				filePath,
				functionCalls,
			});
			const importNodes = node.descendantsOfType(IMPORT_STATEMENT);
			const imports = fetchImportsFromNode({
				importNodes,
			});
			const importPaths = fetchImportPathsFromNode({
				importNodes,
			});

			importPaths.forEach((importPath, i) => {
				// "import { add, sub as minus } from './utils'" -> "add, sub as minus"
				const namedImports = imports[i].match(/\{([^}]*)\}/)?.[1] ?? "";
				// "import foo from './x'" -> default import
				const defaultImport = imports[i].match(/^import\s+([A-Za-z_$][\w$]*)/)?.[1];

				const functionNames = [
					...(defaultImport ? [defaultImport] : []),
					...namedImports
						.split(",")
						.map((name) => name.trim())
						.filter(Boolean)
						// for "sub as minus", the local name used in calls is "minus"
						// biome-ignore lint/style/noNonNullAssertion: <>
						.map((name) => name.split(/\s+as\s+/).pop()!),
				];

				const resolvedPath = resolvePaths("src/index.ts", importPath);

				for (const functionName of functionNames) {
					resolvedImportPaths.push({ functionName, declaredFilePath: resolvedPath, calledFilePath: filePath });
				}
			});
			const finalResult = result.filter((r) => resolvedImportPaths.find((impPath) => impPath.functionName === r.name));
			subModules.push(...finalResult);
		}

		return { subModules, resolvedImportPaths };
	} catch (error) {
		throw new Error(`Failed to build module graph: ${(error as Error).message}`);
	}
}
