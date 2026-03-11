import { Hono } from "hono";
import z from "zod";
import { authMiddleware } from "../../middleware/authentication.middleware";
import { acceptInvitation, inviteUserToWorkspace } from "../../controller/invitations.controller";
import { AcceptInvitationError, AcceptInvitationInDBError, AddInvitaitonInDBError, GetInvitationByIdFromDBError, InviteUserToWorkspaceError } from "../../exceptions/invitations.exceptions";
import { NotFoundError } from "../../exceptions/common.exceptions";
import { AddWorkspaceMemberInDBError } from "../../exceptions/workspaceMember.exceptions";

const invitationsRoute = new Hono();

const InviteUserSchema = z.object({
	email: z.string(),
	workspaceId: z.string(),
	organisationId: z.string(),
});

export type IInviteUserSchema = z.infer<typeof InviteUserSchema> & { invitedBy: string; newUser: boolean };

invitationsRoute.post("/invite-user", authMiddleware, async (c) => {
	try {
		const invitedBy = c.get("user").userId;
		const validation = InviteUserSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const payload: IInviteUserSchema = {
			...validation.data,
			invitedBy,
			newUser: false,
		};
		const inviation = await inviteUserToWorkspace(payload);
		return c.json({ success: true, message: "User invited successfully", invitation: inviation });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 401);
		}
		if (error instanceof AddInvitaitonInDBError || error instanceof InviteUserToWorkspaceError) {
			return c.json({ success: false, error: error.name, message: error.message }, 500);
		}
		return c.json({ success: false, error: "InternalServerError", message: "Something went wrong" }, 500);
	}
});

const AcceptInvitationSchema = z.object({
	invitationId: z.string(),
});

export type IAcceptInvitationSchema = z.infer<typeof AcceptInvitationSchema> & { userId: string };

invitationsRoute.post("/accept-invitation", authMiddleware, async (c) => {
	try {
		const userId = c.get("user").userId;
		const validation = AcceptInvitationSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const payload: IAcceptInvitationSchema = {
			...validation.data,
			userId,
		};
		await acceptInvitation(payload);
		return c.json({ success: true, message: "Invitation accepted successfully" });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 401);
		}
		if (
			error instanceof GetInvitationByIdFromDBError ||
			error instanceof AcceptInvitationInDBError ||
			error instanceof AcceptInvitationError ||
			error instanceof NotFoundError ||
			error instanceof AddWorkspaceMemberInDBError
		) {
			return c.json({ success: false, error: error.name, message: error.message }, 500);
		}
		return c.json({ success: false, error: "InternalServerError", message: "Something went wrong" }, 500);
	}
});

export default invitationsRoute;
