export class GetAccessibleRepositoriesError extends Error {
	public cause?: unknown;
	constructor(message: string, options?: { cause?: unknown }) {
		super(message);
		this.name = "GetAccessibleRepositoriesError";
		if (options?.cause) this.cause = options.cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class GetRepositoryBranchesError extends Error {
	public cause?: unknown;
	constructor(message: string, options?: { cause?: unknown }) {
		super(message);
		this.name = "GetRepositoryBranchesError";
		if (options?.cause) this.cause = options.cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class CheckIfRepoParsedInDBError extends Error {
	public cause?: unknown;
	constructor(message: string, options?: { cause?: unknown }) {
		super(message);
		this.name = "CheckIfRepoParsedInDBError";
		if (options?.cause) this.cause = options.cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class CheckIfRepoParsedError extends Error {
	public cause?: unknown;
	constructor(message: string, options?: { cause?: unknown }) {
		super(message);
		this.name = "CheckIfRepoParsedInDBError";
		if (options?.cause) this.cause = options.cause;
		Error.captureStackTrace(this, this.constructor);
	}
}


export class TraverseDirectoryError extends Error {
	public cause?: unknown;
	constructor(message: string, options?: { cause?: unknown }) {
		super(message);
		this.name = "TraverseDirectoryError";
		if (options?.cause) this.cause = options.cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class ProcessFileContentError extends Error {
	public cause?: unknown;
	constructor(message: string, options?: { cause?: unknown }) {
		super(message);
		this.name = "ProcessFileContentError";
		if (options?.cause) this.cause = options.cause;
		Error.captureStackTrace(this, this.constructor);
	}
}