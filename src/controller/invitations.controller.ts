import { AddInvitaitonInDBError, InviteUserToWorkspaceError } from "../exceptions/invitations.exceptions";
import { addInvitationInDB } from "../repository/invitations.repository";
import type { IInviteUserSchema } from "../routes/v1/invitations.route";

export async function inviteUserToWorkspace(payload: IInviteUserSchema){
    try {
        return await addInvitationInDB(payload);
    } catch (error) {
        if (error instanceof AddInvitaitonInDBError) {
            throw error;
        }
        throw new InviteUserToWorkspaceError("Error inviting user to workspace", { cause: error });
    }
}