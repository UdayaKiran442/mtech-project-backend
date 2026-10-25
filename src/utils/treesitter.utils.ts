import path from "node:path";
import { Language, type Node, Parser } from "web-tree-sitter";
import { getFileContentService } from "../services/octokit.service";
import { resolvePaths } from "./path.utils";

const FILE_IMPORT_REGEX = /^(\.\/|\.\.\/|@\/)/;
const HAS_EXTENSION_REGEX = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

export type SubModule = {
	id: string;
	file: string;
	name: string;
	kind: "file" | "function" | "class" | "method" | "variable";
	exported: boolean;
	startLine: number;
	endLine: number;
};

export type ModuleRelation = {
	type: "contains" | "imports" | "calls";
	from: string;
	to: string;
	fromName: string;
	toName: string;
	line?: number;
};

export type ImportedBinding = {
	local: string;
	imported: string;
	source: string;
	kind: "named" | "default" | "namespace";
};

type RepoContext = {
	installationId: number;
	owner: string;
	repo: string;
	branch: string;
};

type ParsedFile = {
	path: string;
	source: string;
	root: Node;
};

let parserReady: Promise<Parser> | null = null;

async function getParser() {
	if (!parserReady) {
		parserReady = (async () => {
			await Parser.init();
			const parser = new Parser();
			const language = await Language.load(path.join(process.cwd(), "node_modules/tree-sitter-typescript/tree-sitter-typescript.wasm"));
			parser.setLanguage(language);
			return parser;
		})();
	}
	return parserReady;
}

export function moduleId(filePath: string, name?: string) {
	return name ? `${filePath}#${name}` : filePath;
}

function unquote(value: string) {
	return value.replace(/^['"]|['"]$/g, "");
}

function isExported(node: Node) {
	return node.parent?.type === "export_statement";
}

function assignedName(node: Node): string | null {
	let current: Node | null = node.parent;
	while (current) {
		if (current.type === "variable_declarator") {
			return current.childForFieldName("name")?.text ?? null;
		}
		if (current.type === "pair") {
			return current.childForFieldName("key")?.text ?? null;
		}
		current = current.parent;
	}
	return null;
}

function enclosingName(node: Node): string | null {
	let current: Node | null = node.parent;
	while (current) {
		if (current.type === "function_declaration" || current.type === "class_declaration") {
			return current.childForFieldName("name")?.text ?? null;
		}
		if (current.type === "method_definition") {
			const methodName = current.childForFieldName("name")?.text;
			let classNode: Node | null = current.parent;
			while (classNode && classNode.type !== "class_declaration") {
				classNode = classNode.parent;
			}
			const className = classNode?.childForFieldName("name")?.text;
			if (methodName && className) return `${className}.${methodName}`;
			return methodName ?? null;
		}
		if (current.type === "arrow_function" || current.type === "function_expression") {
			const name = assignedName(current);
			if (name) return name;
		}
		current = current.parent;
	}
	return null;
}

export function extractImportedBindings(root: Node): ImportedBinding[] {
	const imports: ImportedBinding[] = [];

	for (const statement of root.descendantsOfType("import_statement")) {
		const source = unquote(statement.childForFieldName("source")?.text ?? "");
		if (!source) continue;

		const clause = statement.namedChildren.find((child) => child.type === "import_clause");
		if (!clause) continue;

		for (const child of clause.namedChildren) {
			if (child.type === "identifier") {
				imports.push({ local: child.text, imported: "default", source, kind: "default" });
				continue;
			}

			if (child.type === "namespace_import") {
				const identifier = child.namedChildren.find((node) => node.type === "identifier");
				if (identifier) {
					imports.push({ local: identifier.text, imported: "*", source, kind: "namespace" });
				}
				continue;
			}

			if (child.type === "named_imports") {
				for (const specifier of child.descendantsOfType("import_specifier")) {
					const importedName = specifier.childForFieldName("name")?.text;
					const alias = specifier.childForFieldName("alias")?.text;
					if (!importedName) continue;
					imports.push({
						local: alias ?? importedName,
						imported: importedName,
						source,
						kind: "named",
					});
				}
			}
		}
	}

	return imports;
}

function collectExportedNames(root: Node) {
	const names = new Set<string>();

	for (const statement of root.descendantsOfType("export_statement")) {
		const declaration = statement.childForFieldName("declaration");
		if (declaration) {
			if (declaration.type === "function_declaration" || declaration.type === "generator_function_declaration" || declaration.type === "class_declaration") {
				const name = declaration.childForFieldName("name")?.text;
				if (name) names.add(name);
			}

			if (declaration.type === "lexical_declaration" || declaration.type === "variable_declaration") {
				for (const declarator of declaration.descendantsOfType("variable_declarator")) {
					const name = declarator.childForFieldName("name")?.text;
					if (name) names.add(name);
				}
			}
		}

		for (const specifier of statement.descendantsOfType("export_specifier")) {
			const alias = specifier.childForFieldName("alias")?.text;
			const name = specifier.childForFieldName("name")?.text;
			if (alias) names.add(alias);
			else if (name) names.add(name);
		}
	}

	return names;
}

export function extractSubModules(filePath: string, root: Node): SubModule[] {
	const exportedNames = collectExportedNames(root);
	const modules: SubModule[] = [
		{
			id: moduleId(filePath),
			file: filePath,
			name: path.basename(filePath),
			kind: "file",
			exported: true,
			startLine: 1,
			endLine: root.endPosition.row + 1,
		},
	];

	const seen = new Set<string>([modules[0].id]);

	const pushModule = (partial: Omit<SubModule, "id" | "file">) => {
		const id = moduleId(filePath, partial.name);
		if (seen.has(id)) return;
		seen.add(id);
		modules.push({ ...partial, id, file: filePath });
	};

	for (const node of root.descendantsOfType("function_declaration")) {
		const name = node.childForFieldName("name")?.text;
		if (!name) continue;
		pushModule({
			name,
			kind: "function",
			exported: isExported(node) || exportedNames.has(name),
			startLine: node.startPosition.row + 1,
			endLine: node.endPosition.row + 1,
		});
	}

	for (const node of root.descendantsOfType("generator_function_declaration")) {
		const name = node.childForFieldName("name")?.text;
		if (!name) continue;
		pushModule({
			name,
			kind: "function",
			exported: isExported(node) || exportedNames.has(name),
			startLine: node.startPosition.row + 1,
			endLine: node.endPosition.row + 1,
		});
	}

	for (const node of root.descendantsOfType("class_declaration")) {
		const name = node.childForFieldName("name")?.text;
		if (!name) continue;
		pushModule({
			name,
			kind: "class",
			exported: isExported(node) || exportedNames.has(name),
			startLine: node.startPosition.row + 1,
			endLine: node.endPosition.row + 1,
		});

		for (const method of node.descendantsOfType("method_definition")) {
			const methodName = method.childForFieldName("name")?.text;
			if (!methodName) continue;
			pushModule({
				name: `${name}.${methodName}`,
				kind: "method",
				exported: isExported(node) || exportedNames.has(name),
				startLine: method.startPosition.row + 1,
				endLine: method.endPosition.row + 1,
			});
		}
	}

	for (const node of root.descendantsOfType("variable_declarator")) {
		const nameNode = node.childForFieldName("name");
		const value = node.childForFieldName("value");
		if (!nameNode || !value) continue;
		if (value.type !== "arrow_function" && value.type !== "function_expression") continue;

		const name = nameNode.text;
		pushModule({
			name,
			kind: "function",
			exported: exportedNames.has(name),
			startLine: node.startPosition.row + 1,
			endLine: node.endPosition.row + 1,
		});
	}

	return modules;
}

export function extractCallRelations(filePath: string, root: Node, symbolTable: Map<string, string>): ModuleRelation[] {
	const relations: ModuleRelation[] = [];

	for (const call of root.descendantsOfType("call_expression")) {
		const fn = call.childForFieldName("function");
		if (!fn) continue;

		let localName: string | null = null;
		let targetId: string | undefined;

		if (fn.type === "identifier") {
			localName = fn.text;
			targetId = symbolTable.get(localName);
		} else if (fn.type === "member_expression") {
			const object = fn.childForFieldName("object");
			const property = fn.childForFieldName("property");
			if (object?.type === "identifier" && property) {
				const namespaceTarget = symbolTable.get(`${object.text}.*`);
				if (namespaceTarget) {
					localName = `${object.text}.${property.text}`;
					targetId = moduleId(namespaceTarget.replace(/#\*$/, ""), property.text);
				} else {
					localName = object.text;
					targetId = symbolTable.get(object.text);
				}
			}
		}

		if (!localName || !targetId || targetId.startsWith("external:")) continue;

		const fromName = enclosingName(call) ?? path.basename(filePath);
		const from = enclosingName(call) ? moduleId(filePath, enclosingName(call) ?? undefined) : moduleId(filePath);
		const toName = targetId.includes("#") ? targetId.split("#")[1] : localName;

		relations.push({
			type: "calls",
			from,
			to: targetId,
			fromName,
			toName,
			line: call.startPosition.row + 1,
		});
	}

	return relations;
}

function importCandidates(sourceFilePath: string, importSpecifier: string) {
	const normalised = resolvePaths(sourceFilePath, importSpecifier);
	const withoutExt = normalised.replace(HAS_EXTENSION_REGEX, "");
	return [normalised, `${withoutExt}.ts`, `${withoutExt}.tsx`, `${withoutExt}.js`, path.join(withoutExt, "index.ts")].filter((value, index, list) => list.indexOf(value) === index);
}

async function decodeFile(repo: RepoContext, filePath: string) {
	const fileContent = (await getFileContentService({
		...repo,
		path: filePath,
	})) as { content?: string; type?: string };

	if (!fileContent?.content || Array.isArray(fileContent)) return null;
	const decodedContent = Buffer.from(fileContent.content, "base64").toString("utf8");
	console.log(decodedContent);
	return decodedContent;
}

async function resolveImportedFile(repo: RepoContext, sourceFilePath: string, importSpecifier: string) {
	if (!FILE_IMPORT_REGEX.test(importSpecifier)) return null;

	for (const candidate of importCandidates(sourceFilePath, importSpecifier)) {
		try {
			const source = await decodeFile(repo, candidate);
			if (source !== null) return { path: candidate, source };
		} catch {
			// Try the next extension / index file.
		}
	}

	return null;
}

async function parseFile(filePath: string, source: string): Promise<ParsedFile> {
	const parser = await getParser();
	const tree = parser.parse(source);
	if (!tree) {
		throw new Error(`Failed to parse ${filePath}`);
	}
	return { path: filePath, source, root: tree.rootNode };
}

export async function buildModuleGraph(repo: RepoContext & { entryPath: string }) {
	const { entryPath, ...repoContext } = repo;
	const entrySource = await decodeFile(repoContext, entryPath);
	if (entrySource === null) {
		throw new Error(`Could not read entry file ${entryPath}`);
	}

	const files = new Map<string, ParsedFile>();
	files.set(entryPath, await parseFile(entryPath, entrySource));

	const modules: SubModule[] = [];
	const relations: ModuleRelation[] = [];
	const parsedImports: Array<{ file: string; bindings: ImportedBinding[]; resolvedPath?: string }> = [];

	for (const [filePath, parsed] of files) {
		const bindings = extractImportedBindings(parsed.root);
		for (const binding of bindings) {
			if (!FILE_IMPORT_REGEX.test(binding.source)) {
				parsedImports.push({ file: filePath, bindings: [binding] });
				continue;
			}

			const resolved = await resolveImportedFile(repoContext, filePath, binding.source);
			parsedImports.push({
				file: filePath,
				bindings: [binding],
				resolvedPath: resolved?.path,
			});

			if (resolved && !files.has(resolved.path)) {
				files.set(resolved.path, await parseFile(resolved.path, resolved.source));
			}
		}
	}

	const symbolTables = new Map<string, Map<string, string>>();

	for (const [filePath, parsed] of files) {
		const fileModules = extractSubModules(filePath, parsed.root);
		modules.push(...fileModules);

		for (const submodule of fileModules) {
			if (submodule.kind === "file") continue;
			relations.push({
				type: "contains",
				from: moduleId(filePath),
				to: submodule.id,
				fromName: path.basename(filePath),
				toName: submodule.name,
			});
		}

		const table = new Map<string, string>();
		for (const submodule of fileModules) {
			if (submodule.kind !== "file") {
				table.set(submodule.name, submodule.id);
			}
		}
		symbolTables.set(filePath, table);
	}

	const modulesById = new Map(modules.map((module) => [module.id, module]));

	for (const item of parsedImports) {
		const table = symbolTables.get(item.file) ?? new Map<string, string>();
		for (const binding of item.bindings) {
			const targetFile = item.resolvedPath;
			const targetId = targetFile
				? binding.kind === "namespace"
					? moduleId(targetFile, "*")
					: binding.kind === "default"
						? moduleId(targetFile, "default")
						: moduleId(targetFile, binding.imported)
				: `external:${binding.source}${binding.imported === "*" ? "" : `#${binding.imported}`}`;

			if (binding.kind === "namespace") {
				table.set(`${binding.local}.*`, targetId);
			} else {
				table.set(binding.local, targetId);
			}

			relations.push({
				type: "imports",
				from: moduleId(item.file),
				to: targetId,
				fromName: path.basename(item.file),
				toName: binding.imported,
			});

			if (targetFile && !modulesById.has(targetId) && binding.kind === "named") {
				const stub: SubModule = {
					id: targetId,
					file: targetFile,
					name: binding.imported,
					kind: "function",
					exported: true,
					startLine: 1,
					endLine: 1,
				};
				modules.push(stub);
				modulesById.set(stub.id, stub);
			}
		}
		symbolTables.set(item.file, table);
	}

	for (const [filePath, parsed] of files) {
		relations.push(...extractCallRelations(filePath, parsed.root, symbolTables.get(filePath) ?? new Map()));
	}

	return {
		entryPath,
		files: [...files.keys()],
		modules,
		relations,
	};
}
