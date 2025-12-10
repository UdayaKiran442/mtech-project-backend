export class AddUserInDBError extends Error {
	public cause?: unknown;
	constructor(message: string, options?: { cause?: unknown }) {
		super(message);
		this.name = "AddUserInDBError";
		if (options?.cause) this.cause = options.cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class RegisterUserError extends Error {
	public cause?: unknown;
	constructor(message: string, options?: { cause?: unknown }) {
		super(message);
		this.name = "RegisterUserError";
		if (options?.cause) this.cause = options.cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class GetUserByIdFromDBError extends Error {
	public cause?: unknown;
	constructor(message: string, options?: { cause?: unknown }) {
		super(message);
		this.name = "GetUserByIdFromDBError";
		if (options?.cause) this.cause = options.cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class GetUserByEmailFromDBError extends Error {
	public cause?: unknown;
	constructor(message: string, options?: { cause?: unknown }) {
		super(message);
		this.name = "GetUserByEmailFromDBError";
		if (options?.cause) this.cause = options.cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class LoginUserError extends Error {
	public cause?: unknown;
	constructor(message: string, options?: { cause?: unknown }) {
		super(message);
		this.name = "LoginUserError";
		if (options?.cause) this.cause = options.cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class InvalidCredentialsError extends Error {
	public cause?: unknown;
	constructor(message: string, options?: { cause?: unknown }) {
		super(message);
		this.name = "InvalidCredentialsError";
		if (options?.cause) this.cause = options.cause;
		Error.captureStackTrace(this, this.constructor);
	}
}
