import { Hono } from "hono";
import z from "zod";
import { authMiddleware } from "../../middleware/authentication.middleware";
import { queryCodebot } from "../../controller/codebot.controller";

const codebotRoute = new Hono();

const QueryCodebotSchema = z.object({
	query: z.string(),
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
			userId: c.get("user").userId,
		};
		await queryCodebot(payload);
		return c.json({ success: true }, 200);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 422);
		}
	}
});

export default codebotRoute;
