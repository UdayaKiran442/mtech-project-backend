import { eq } from "drizzle-orm";
import { CheckIfWorkspaceUrlIsUniqueInDBError, CreateWorkspaceInDBError } from "../exceptions/workspace.exceptions";
import type { ICreateWorkspaceSchema } from "../routes/v1/workspace.route";
import { generateNanoId } from "../utils/nano.utils";
import db from "./db";
import { workspace } from "./schema";

export async function createWorkspaceInDB(payload: ICreateWorkspaceSchema) {
	try {
		const insertPayload = {
			workspaceId: `ws_${generateNanoId()}`,
			workspaceName: payload.workspaceName,
			workspaceUrl: payload.workspaceUrl,
			organisationId: payload.organisationId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		await db.insert(workspace).values(insertPayload);
		return insertPayload;
	} catch (error) {
		throw new CreateWorkspaceInDBError("Failed to create workspace in DB", { cause: (error as Error).cause });
	}
}

export async function checkIfWorkspaceUrlIsUniqueInDB(workspaceUrl: string) {
	try {
		return await db.select().from(workspace).where(eq(workspace.workspaceUrl, workspaceUrl));
	} catch (error) {
		throw new CheckIfWorkspaceUrlIsUniqueInDBError("Failed to check if workspace URL is unique in DB", { cause: (error as Error).cause });
	}
}
