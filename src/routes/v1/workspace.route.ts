import { Hono } from "hono";
import z from "zod";
import { authMiddleware } from "../../middleware/authentication.middleware";
import { addKnowledgeToWorkspace, createWorkspace, fetchWorkspaceMembers, isWorkspaceUrlUnique } from "../../controller/workspace.controller";
import { UpdateUserInDBError } from "../../exceptions/user.exceptions";
import { CheckIfWorkspaceUrlIsUniqueInDBError, CreateWorkspaceError, CreateWorkspaceInDBError, FetchWorkspaceMembersError, IsWorkspaceUrlUniqueError } from "../../exceptions/workspace.exceptions";
import { AddWorkspaceMemberInDBError, FetchWorkspaceMembersInDBError } from "../../exceptions/workspaceMember.exceptions";

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
		if (error instanceof CreateWorkspaceInDBError || error instanceof UpdateUserInDBError || error instanceof CreateWorkspaceError || error instanceof AddWorkspaceMemberInDBError) {
			return c.json({ success: false, message: error.message, error: error.cause }, 500);
		}
		return c.json({ success: false, message: "Failed to create workspace", error: (error as Error).message }, 500);
	}
});

const UniqueUrlSchema = z.object({
	workspaceUrl: z.string(),
});

export type IUniqueUrlSchema = z.infer<typeof UniqueUrlSchema>;

workspaceRoute.post("/unique-url", async (c) => {
	try {
		const validation = UniqueUrlSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const payload = validation.data;
		const isUnique = await isWorkspaceUrlUnique(payload.workspaceUrl);
		return c.json({ success: true, isUnique });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 401);
		}
		if (error instanceof IsWorkspaceUrlUniqueError || error instanceof CheckIfWorkspaceUrlIsUniqueInDBError) {
			return c.json({ success: false, message: error.message, error: error.cause }, 500);
		}
		return c.json({ success: false, message: "Failed to validate workspace url", error: (error as Error).message }, 500);
	}
});

const FetchWorkspaceMembersSchema = z.object({
	workspaceId: z.string(),
});

export type IFetchWorkspaceMembersSchema = z.infer<typeof FetchWorkspaceMembersSchema>;

workspaceRoute.post("/fetch-members", authMiddleware, async (c) => {
	try {
		const validation = FetchWorkspaceMembersSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const { userId } = c.get("user");
		const payload = {
			...validation.data,
			adminId: userId,
		};
		const members = await fetchWorkspaceMembers(payload);
		return c.json({ success: true, members });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 401);
		}
		if (error instanceof FetchWorkspaceMembersInDBError || error instanceof FetchWorkspaceMembersError) {
			return c.json({ success: false, message: error.message, error: error.cause }, 500);
		}
		return c.json({ success: false, message: "Failed to validate workspace url", error: (error as Error).message }, 500);
	}
});

const AddKnowledgeSchema = z.object({
	workspaceId: z.string(),
	fileUrl: z.string(),
	key: z.string(),
});

export type IAddKnowledgeSchema = z.infer<typeof AddKnowledgeSchema> & { uploadedBy: string };

workspaceRoute.post("/add-knowledge", authMiddleware, async (c) => {
	try {
		const validation = AddKnowledgeSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const payload = {
			...validation.data,
			uploadedBy: c.get("user").userId,
		};
		await addKnowledgeToWorkspace(payload);
		return c.json({ success: true });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 401);
		}
		return c.json({ success: false, message: "Failed to add knowledge to workspace", error: (error as Error).message }, 500);
	}
});

export default workspaceRoute;
