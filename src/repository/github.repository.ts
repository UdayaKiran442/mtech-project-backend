import { and, eq } from "drizzle-orm";
import type { ICheckIfRepoParsedSchema, IParsedRepositorySchema } from "../routes/v1/github.route";
import db from "./db";
import { parsedRepos } from "./schema";
import { AddParsedRepoToDBError, CheckIfRepoParsedInDBError } from "../exceptions/github.exceptions";

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

export async function addParsedRepoToDB(payload: IParsedRepositorySchema){
	try {
		const insertPayload = {
			repoName: payload.repoName,
			branch: payload.branch,
			userId: payload.userId,
			createdAt: new Date(),
		}
		await db.insert(parsedRepos).values(insertPayload);
		return insertPayload;
	} catch (error) {
		throw new AddParsedRepoToDBError("Failed to add parsed repository to DB", { cause: (error as Error).message });
	}
}