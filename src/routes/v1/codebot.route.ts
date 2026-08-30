import { Hono } from "hono";
import z from "zod";
import { createCodebotChat, queryCodebot } from "../../controller/codebot.controller";
import { CreateCodebotChatError, CreateCodebotChatInDBError } from "../../exceptions/codebot.exceptions";
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

export default codebotRoute;
