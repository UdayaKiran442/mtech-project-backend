export type AuthContext = {
	Variables: {
		user: {
			userId: string;
		};
	};
};

export type GitContext = {
	Variables: {
		token: {
			accessToken: string;
		};
	};
};

export type IUpdateUserPayload = {
	userId: string;
	name?: string;
	organisationId?: string;
	isGitHubConnected?: boolean;
};
