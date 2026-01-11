import { eq } from "drizzle-orm";
import { AddWorkspaceMemberInDBError, FetchWorkspaceMembersInDBError } from "../exceptions/workspaceMember.exceptions";
import { generateNanoId } from "../utils/nano.utils";
import db from "./db";
import { users, workspaceMembers } from "./schema";

export async function addWorkspaceMemberInDB(payload: {workspaceId: string; userId: string; role: string}){
    try {
        const insertPayload = {
            memberId: `member_${generateNanoId()}`,
            workspaceId: payload.workspaceId,
            userId: payload.userId,
            role: payload.role,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        await db.insert(workspaceMembers).values(insertPayload);
        return insertPayload;
    } catch (error) {
        throw new AddWorkspaceMemberInDBError("Failed to add workspace member in DB", { cause: (error as Error).cause });
    }
}

export async function getWorkspaceMembersFromDB(workspaceId: string) {
    try {
        const members = await db.select(
            {
                memberId: workspaceMembers.memberId,
                workspaceId: workspaceMembers.workspaceId,
                userId: workspaceMembers.userId,
                role: workspaceMembers.role,
                name: users.name,
                email: users.email,
            }
        ).from(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId)).leftJoin(users, eq(workspaceMembers.userId, users.userId));
        return members[0];
    } catch (error) {
        throw new FetchWorkspaceMembersInDBError("Failed to fetch workspace members from DB", { cause: (error as Error).cause });
    }
}