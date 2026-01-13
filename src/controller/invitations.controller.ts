import { NotFoundError } from "../exceptions/common.exceptions";
import { AcceptInvitationError, AcceptInvitationInDBError, AddInvitaitonInDBError, GetInvitationByIdFromDBError, InviteUserToWorkspaceError } from "../exceptions/invitations.exceptions";
import { acceptInvitationInDB, addInvitationInDB, getInvitationByIdFromDB } from "../repository/invitations.repository";
import { getUserByEmailFromDB } from "../repository/user.repository";
import type { IAcceptInvitationSchema, IInviteUserSchema } from "../routes/v1/invitations.route";

export async function inviteUserToWorkspace(payload: IInviteUserSchema) {
	try {
		const user = await getUserByEmailFromDB(payload.email);
		if (user) {
			payload.newUser = false;
		}
		return await addInvitationInDB(payload);
	} catch (error) {
		if (error instanceof AddInvitaitonInDBError) {
			throw error;
		}
		throw new InviteUserToWorkspaceError("Error inviting user to workspace", { cause: (error as Error).cause });
	}
}

export async function acceptInvitation(payload: IAcceptInvitationSchema) {
	try {
		// get inviation from db
		const invitation = await getInvitationByIdFromDB(payload.invitationId);
		// if not found throw error
		if (!invitation) {
			// throw not found error
			throw new NotFoundError("Invitation not found", { cause: "Invitation not found in db" });
		}
		if (invitation.accepted) {
			throw new AcceptInvitationError("Invitation already accepted", { cause: "Invitation already accepted" });
		}
		// if found update accepted to true
		await acceptInvitationInDB(payload.invitationId);
	} catch (error) {
		if (error instanceof GetInvitationByIdFromDBError || error instanceof AcceptInvitationInDBError || error instanceof NotFoundError) {
			throw error;
		}
		throw new AcceptInvitationError("Error accepting invitation", { cause: (error as Error).cause });
	}
}
