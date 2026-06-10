import * as path from "path";

export function resolvePaths(sourceFilePath: string, importSpecifier: string) {
    console.log(`Resolving path for source file: ${sourceFilePath} and import specifier: ${importSpecifier}`);
	const sourceDir = path.dirname(sourceFilePath);
	const resolvedPath = path.join(sourceDir, importSpecifier);
    // add file extension if not present
    if (!path.extname(resolvedPath)) {
        const sourceExt = path.extname(sourceFilePath);
        return `${resolvedPath}${sourceExt}`;
    }
    return resolvedPath;
}
