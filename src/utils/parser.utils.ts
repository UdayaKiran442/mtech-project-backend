import path from "node:path";
import { Language, Parser } from "web-tree-sitter";

export default async function parserInstance() {
	try {
		await Parser.init();
		const parser = new Parser();
		const language = await Language.load(path.join(process.cwd(), "node_modules/tree-sitter-typescript/tree-sitter-typescript.wasm"));
		parser.setLanguage(language);
		return parser;
	} catch (error) {
		throw new Error(`Failed to initialize parser instance: ${(error as Error).message}`);
	}
}
