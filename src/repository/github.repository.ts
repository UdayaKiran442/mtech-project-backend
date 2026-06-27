import { and, eq, ilike } from "drizzle-orm";
import type { ICheckIfRepoParsedSchema, IParsedRepositorySchema } from "../routes/v1/github.route";
import db from "./db";
import { parsedRepoFiles, parsedRepos } from "./schema";
import { AddParsedRepoToDBError, CheckIfRepoParsedInDBError, InsertRepoFileToDBError, SearchRepoFileInDBError } from "../exceptions/github.exceptions";
import type { ISearchFilesSchema } from "../routes/v1/search.route";

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

export async function addParsedRepoToDB(payload: IParsedRepositorySchema) {
	try {
		const insertPayload = {
			repoName: payload.repoName,
			branch: payload.branch,
			userId: payload.userId,
			createdAt: new Date(),
		};
		await db.insert(parsedRepos).values(insertPayload);
		return insertPayload;
	} catch (error) {
		throw new AddParsedRepoToDBError("Failed to add parsed repository to DB", { cause: (error as Error).message });
	}
}

export async function insertRepoFileToDB(payload: { repoName: string; branch: string; userId: string; filePath: string; fileName: string }) {
	try {
		const insertPayload = {
			repoName: payload.repoName,
			branch: payload.branch,
			userId: payload.userId,
			filePath: payload.filePath,
			fileName: payload.fileName,
			createdAt: new Date(),
		};
		await db.insert(parsedRepoFiles).values(insertPayload);
		return insertPayload;
	} catch (error) {
		throw new InsertRepoFileToDBError("Failed to insert repository file to DB", { cause: (error as Error).message });
	}
}

export async function searchRepoFileInDB(payload: ISearchFilesSchema) {
	try {
		return await db
			.select()
			.from(parsedRepoFiles)
			.where(
				and(
					ilike(parsedRepoFiles.fileName, `%${payload.searchString}%`),
					eq(parsedRepoFiles.userId, payload.userId),
					eq(parsedRepoFiles.repoName, payload.repoName),
					eq(parsedRepoFiles.branch, payload.branch),
				),
			);
	} catch (error) {
		throw new SearchRepoFileInDBError("Failed to search repository file in DB", { cause: (error as Error).message });
	}
}
