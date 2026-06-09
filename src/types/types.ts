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
}


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
}