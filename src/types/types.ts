import type { CALL_EXPRESSION, CLASS_DECLARATION, FUNCTION_DECLARATION } from "../constants/subModuleType.constants";

export type AuthContext = {
	Variables: {
		user: {
			userId: string;
		};
	};
};

export type IUpdateUserPayload = {
	userId: string;
	name?: string;
	organisationId?: string;
	isGitHubConnected?: boolean;
	githubUsername?: string;
	githubInstallationId?: string;
};

// export type IRepoFile = {
// 	name: string;
// 	path: string;
// 	sha: string;
// 	size: number;
// 	url: string;
// 	html_url: string | null;
// 	git_url: string | null;
// 	download_url: string | null;
// 	content?: string;
// 	encoding?: string;
// 	type: string;
// 	_links: {
// 		self: string;
// 		git: string | null;
// 		html: string | null;
// 	};
// };

export type IRepoFolder = {
	type: "dir" | "file" | "submodule" | "symlink";
	size: number;
	name: string;
	path: string;
	sha: string;
	url: string;
	git_url: string | null;
	html_url: string | null;
	download_url: string | null;
	_links: {
		git: string | null;
		html: string | null;
		self: string;
	};
};

export type IRepoFileContent = {
	type: "dir" | "file" | "submodule" | "symlink";
	size: number;
	name: string;
	path: string;
	content: string;
	encoding: string;
	sha: string;
	url: string;
	git_url: string | null;
	html_url: string | null;
	download_url: string | null;
	_links: {
		git: string | null;
		html: string | null;
		self: string;
	};
};

export type IRepoContext = {
	installationId: number;
	owner: string;
	repo: string;
	branch: string;
};

export type ISubModule = {
	id: string;
	name: string;
	type: ISubModuleType;
	code: string;
	filePath: string;
	startIndex: number;
	endIndex: number;
	startLine: number;
	endLine: number;
};

export type ISubModuleType = typeof FUNCTION_DECLARATION | typeof CLASS_DECLARATION | typeof CALL_EXPRESSION;
