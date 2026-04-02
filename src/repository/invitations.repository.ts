import { eq } from "drizzle-orm";
import { AcceptInvitationInDBError, AddInvitaitonInDBError, GetInvitationByIdFromDBError } from "../exceptions/invitations.exceptions";
import type { IInviteUserSchema } from "../routes/v1/invitations.route";
import { generateNanoId } from "../utils/nano.utils";
import db from "./db";
import { invitations } from "./schema";

// Function to add an invitation to the database
export async function addInvitationInDB(payload: IInviteUserSchema) {
	try {
		const insertPayload = {
			invitationId: `invitation_${generateNanoId()}`,
			workspaceId: payload.workspaceId,
			organisationId: payload.organisationId,
			email: payload.email,
			invitedBy: payload.invitedBy,
			newUser: payload.newUser,
			invitedAt: new Date(),
		};
		await db.insert(invitations).values(insertPayload);
		return insertPayload;
	} catch (error) {
		throw new AddInvitaitonInDBError("Error adding invitation in DB", { cause: error });
	}
}

// Function to get an invitation by id from the database
export async function getInvitationByIdFromDB(invitationId: string) {
	try {
		const invitation = await db.select().from(invitations).where(eq(invitations.invitationId, invitationId));
		return invitation[0];
	} catch (error) {
		throw new GetInvitationByIdFromDBError("Failed to get invitation by id from db", { cause: (error as Error).cause });
	}
}

// Function to accept an invitation in the database
export async function acceptInvitationInDB(invitationId: string) {
	try {
		await db.update(invitations).set({ accepted: true }).where(eq(invitations.invitationId, invitationId));
	} catch (error) {
		throw new AcceptInvitationInDBError("Failed to accept invitation in db", { cause: (error as Error).cause });
	}
}
