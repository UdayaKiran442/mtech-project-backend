import { NotFoundError } from "../exceptions/common.exceptions";
import { AcceptInvitationError, AcceptInvitationInDBError, AddInvitaitonInDBError, GetInvitationByIdFromDBError, InviteUserToWorkspaceError } from "../exceptions/invitations.exceptions";
import { AddWorkspaceMemberInDBError } from "../exceptions/workspaceMember.exceptions";
import { acceptInvitationInDB, addInvitationInDB, getInvitationByIdFromDB } from "../repository/invitations.repository";
import { getUserByEmailFromDB } from "../repository/user.repository";
import { addWorkspaceMemberInDB } from "../repository/workspaceMembers.repository";
import type { IAcceptInvitationSchema, IInviteUserSchema } from "../routes/v1/invitations.route";

/**
 * 
 * @param payload 
 * @description 
 * - First it checks if the user with the email already exists in the database. If user exists, it sets newUser to false else true
 * - Then function to add an invitation to the database is called and the invitation details are returned
 * @returns New Invitation details
 */
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

// TODO: handle case when user is not registered to workspace
/**
 * 
 * @param payload 
 * @description 
 * - First it checks if the invitation exists in the database. If not, it throws an error
 * - Then it checks if the invitation is already accepted. If accepted, it throws an error
 * - If invitation exists and not accepted, then it updates the invitation as accepted and adds the user to workspace members with member role
 * @returns void
 */
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
		await Promise.all([
			acceptInvitationInDB(payload.invitationId),
			addWorkspaceMemberInDB({ workspaceId: invitation.workspaceId, userId: payload.userId, role: "member" }),
		]);
	} catch (error) {
		if (error instanceof GetInvitationByIdFromDBError || error instanceof AcceptInvitationInDBError || error instanceof NotFoundError || error instanceof AddWorkspaceMemberInDBError) {
			throw error;
		}
		throw new AcceptInvitationError("Error accepting invitation", { cause: (error as Error).cause });
	}
}
