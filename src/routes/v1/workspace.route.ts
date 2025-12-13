import { Hono } from "hono";
import z from "zod";
import { authMiddleware } from "../../middleware/authentication.middleware";
import { createWorkspace } from "../../controller/workspace.controller";
import { UpdateUserInDBError } from "../../exceptions/user.exceptions";
import { CreateWorkspaceError, CreateWorkspaceInDBError } from "../../exceptions/workspace.exceptions";

const workspaceRoute = new Hono();

const CreateWorkspaceSchema = z.object({
	organisationId: z.string(),
	workspaceUrl: z.string(),
	workspaceName: z.string(),
});

export type ICreateWorkspaceSchema = z.infer<typeof CreateWorkspaceSchema> & { adminId: string };

workspaceRoute.post("/create", authMiddleware, async (c) => {
	try {
		const validation = CreateWorkspaceSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const payload = {
			...validation.data,
			adminId: c.get("user").userId,
		};
		const newWorkspace = await createWorkspace(payload);
		return c.json({ success: true, message: "Workspace created successfully", workspace: newWorkspace });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 401);
		}
		if (error instanceof CreateWorkspaceInDBError || error instanceof UpdateUserInDBError || error instanceof CreateWorkspaceError) {
			return c.json({ success: false, message: error.message, error: error.cause }, 500);
		}
		return c.json({ success: false, message: "Failed to create workspace", error: (error as Error).message }, 500);
	}
});

export default workspaceRoute;
