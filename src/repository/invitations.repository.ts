import { AddInvitaitonInDBError } from "../exceptions/invitations.exceptions";
import type { IInviteUserSchema } from "../routes/v1/invitations.route";
import { generateNanoId } from "../utils/nano.utils";
import db from "./db";
import { invitations } from "./schema";

export async function addInvitationInDB(payload: IInviteUserSchema){
    try {
        const insertPayload = {
            invitationId: `invitation_${generateNanoId()}`,
            workspaceId: payload.workspaceId,
            organisationId: payload.organisationId,
            email: payload.email,
            invitedBy: payload.invitedBy,
            invitedAt: new Date(),
        }
        await db.insert(invitations).values(insertPayload);
        return insertPayload;
    } catch (error) {
        throw new AddInvitaitonInDBError("Error adding invitation in DB", { cause: error });
    }
}