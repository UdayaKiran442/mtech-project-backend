import type { Node } from "web-tree-sitter";
import { FUNCTION_DECLARATION } from "../constants/subModuleType.constants";
import { getFileContentService } from "../services/octokit.service";
import type { IRepoContext, ISubModule } from "../types/types";
import parserInstance from "./parser.utils";

export function fetchImportPathsFromNode(payload: { importNodes: Node[] }): string[] {
	return payload.importNodes
		.map((importNode) => {
			const importPathNode = importNode.descendantsOfType("string")[0];
			if (importPathNode) {
				let importPath = importPathNode.text;
				// remove quotes from the import path
				importPath = importPath.replace(/['"]/g, "");
				return importPath;
			}
			return null;
		})
		.filter((importPath) => importPath?.startsWith(".") || importPath?.startsWith("@")) as string[];
}

export async function fetchFileNode(payload: { repoContext: IRepoContext; filePath: string }) {
	try {
		const fileContent = await getFileContentService({
			branch: payload.repoContext.branch,
			owner: payload.repoContext.owner,
			repo: payload.repoContext.repo,
			installationId: payload.repoContext.installationId,
			path: payload.filePath,
		});
		if (!fileContent || !fileContent.content) {
			throw new Error(`File content not found for path: ${payload.filePath}`);
		}
		const decodedString = Buffer.from(fileContent.content, "base64").toString("utf8");
		// use the parser to parse the decoded string
		const parser = await parserInstance();
		const tree = parser.parse(decodedString);
		if (!tree) {
			throw new Error(`Failed to parse the file content for path: ${payload.filePath}`);
		}
		const node = tree.rootNode;
		return { node, decodedString };
	} catch (error) {
		throw new Error(`Error fetching file node for path ${payload.filePath}: ${(error as Error).message}`);
	}
}

export async function fetchFunctionDeclarationsFromNode(payload: { functionDeclarations: Node[]; decodedString: string; resolvedPath: string }) {
	try {
		return payload.functionDeclarations.map((funcNode) => {
			const startIndex = funcNode.startIndex;
			const endIndex = funcNode.endIndex;
			const funcName = funcNode.childForFieldName("name")?.text || "anonymous";
			const startLine = funcNode.startPosition.row + 1;
			const endLine = funcNode.endPosition.row + 1;
			console.log(`Function ${funcName} found from line ${startLine} to line ${endLine}`);
			console.log(`Function name: ${funcName}, Start index: ${startIndex}, End index: ${endIndex}`);
			const code = payload.decodedString.slice(startIndex, endIndex);
			return {
				id: `${payload.resolvedPath}#${funcName}`,
				name: funcName,
				code,
				startIndex,
				endIndex,
				startLine,
				endLine,
				type: FUNCTION_DECLARATION as ISubModule["type"],
				filePath: payload.resolvedPath,
			};
		});
	} catch (error) {
		throw new Error(`Error fetching function declarations from node: ${(error as Error).message}`);
	}
}
