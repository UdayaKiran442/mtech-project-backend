import { Hono } from "hono";
import z from "zod";
import { createCodebotChat, fetchUserCodebotChats, queryCodebot, updateCodebotChatName } from "../../controller/codebot.controller";
import {
	CreateCodebotChatError,
	CreateCodebotChatInDBError,
	FetchCodebotChatByIdFromDBError,
	FetchUserCodebotChatsError,
	FetchUserCodebotChatsFromDBError,
	UpdateCodebotChatNameError,
	UpdateCodebotChatNameInDBError,
} from "../../exceptions/codebot.exceptions";
import { NotFoundError } from "../../exceptions/common.exceptions";
import { authMiddleware } from "../../middleware/authentication.middleware";

const codebotRoute = new Hono();

const QueryCodebotSchema = z.object({
	query: z.string(),
	codebotChatId: z.string(),
	selectedFiles: z.array(
		z.object({
			path: z.string(),
			type: z.enum(["repo", "knowledgeBase"]),
		}),
	),
});

export type IQueryCodebotSchema = z.infer<typeof QueryCodebotSchema> & { userId: string };

codebotRoute.post("/query", authMiddleware, async (c) => {
	try {
		const validation = QueryCodebotSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const payload = {
			...validation.data,
			userId: 'c.get("user").userId',
		};
		const result = await queryCodebot(payload);
		return c.json({ success: true, result }, 200);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 422);
		}
	}
});

const CreateCodebotChatSchema = z.object({
	workspaceId: z.string(),
});

export type ICreateCodebotChatSchema = z.infer<typeof CreateCodebotChatSchema> & { userId: string };

codebotRoute.post("/new-chat", authMiddleware, async (c) => {
	try {
		const validation = CreateCodebotChatSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const payload = {
			...validation.data,
			userId: c.get("user").userId,
		};
		const response = await createCodebotChat(payload);
		return c.json({ success: true, response }, 200);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 422);
		}
		if (error instanceof CreateCodebotChatError || error instanceof CreateCodebotChatInDBError) {
			return c.json({ success: false, error: error.cause, message: error.message }, 400);
		}
		return c.json({ success: false, error: "InternalServerError", message: "Something went wrong" }, 500);
	}
});

// fetch all codebot chats for a user in the workspace
const FetchCodebotChatsSchema = z.object({
	workspaceId: z.string(),
});

export type IFetchCodebotChatsSchema = z.infer<typeof FetchCodebotChatsSchema> & { userId: string };

codebotRoute.post("/fetch-chats", authMiddleware, async (c) => {
	try {
		const validation = FetchCodebotChatsSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const payload = {
			...validation.data,
			userId: c.get("user").userId,
		};
		const codebotChats = await fetchUserCodebotChats(payload);
		return c.json({ success: true, codebotChats }, 200);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 422);
		}
		if (error instanceof FetchUserCodebotChatsFromDBError || error instanceof FetchUserCodebotChatsError) {
			return c.json({ success: false, error: error.cause, message: error.message }, 400);
		}
		return c.json({ success: false, error: "InternalServerError", message: "Something went wrong" }, 500);
	}
});

// Update codebot chat name
const UpdateCodebotChatNameSchema = z.object({
	codebotChatId: z.string(),
	codebotChatName: z.string(),
});

export type IUpdateCodebotChatNameSchema = z.infer<typeof UpdateCodebotChatNameSchema> & { userId: string };

codebotRoute.post("/update-chatname", authMiddleware, async (c) => {
	try {
		const validation = UpdateCodebotChatNameSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const payload = {
			...validation.data,
			userId: c.get("user").userId,
		};
		const response = await updateCodebotChatName(payload);
		return c.json({ success: true, response }, 200);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 422);
		}
		if (error instanceof FetchCodebotChatByIdFromDBError || error instanceof UpdateCodebotChatNameInDBError || error instanceof UpdateCodebotChatNameError) {
			return c.json({ success: false, error: error.cause, message: error.message }, 400);
		}
		if (error instanceof NotFoundError) {
			return c.json({ success: false, error: error.cause, message: error.message }, 404);
		}
		return c.json({ success: false, error: "InternalServerError", message: "Something went wrong" }, 500);
	}
});

export default codebotRoute;
