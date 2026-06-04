import { and, eq } from "drizzle-orm";
import type { ICheckIfRepoParsedSchema } from "../routes/v1/github.route";
import db from "./db";
import { parsedRepos } from "./schema";
import { CheckIfRepoParsedInDBError } from "../exceptions/github.exceptions";

export async function checkIfRepoParsedInDB(payload: ICheckIfRepoParsedSchema) {
	try {
		const repo = await db
			.select()
			.from(parsedRepos)
			.where(and(eq(parsedRepos.repoName, payload.repoName), eq(parsedRepos.branch, payload.branch), eq(parsedRepos.userId, payload.userId)));
		return repo.length > 0;
	} catch (error) {
		throw new CheckIfRepoParsedInDBError("Failed to check if repository is parsed in DB", { cause: (error as Error).message });
	}
}
