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
