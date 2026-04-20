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
