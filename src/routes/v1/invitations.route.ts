import { Hono } from "hono";
import z from "zod";
import { authMiddleware } from "../../middleware/authentication.middleware";
import { inviteUserToWorkspace } from "../../controller/invitations.controller";
import { AddInvitaitonInDBError, InviteUserToWorkspaceError } from "../../exceptions/invitations.exceptions";

const invitationsRoute = new Hono();

const InviteUserSchema = z.object({
	email: z.string(),
	workspaceId: z.string(),
	organisationId: z.string(),
});

export type IInviteUserSchema = z.infer<typeof InviteUserSchema> & { invitedBy: string };

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

export default invitationsRoute;
