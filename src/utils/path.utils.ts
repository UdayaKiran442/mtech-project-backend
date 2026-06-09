import * as path from "path";

export function resolvePaths(sourceFilePath: string, importSpecifier: string) {
	const sourceDir = path.dirname(sourceFilePath);
	const resolved = path.join(sourceDir, importSpecifier);
	return path.normalize(resolved);
}
