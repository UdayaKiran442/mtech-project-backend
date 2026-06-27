import { Hono } from "hono";
import z from "zod";
import { authMiddleware } from "../../middleware/authentication.middleware";
import { searchFiles } from "../../controller/search.controller";
import { SearchRepoFileInDBError } from "../../exceptions/github.exceptions";
import { SearchKnowledgeBaseFilesInDBError } from "../../exceptions/knowledgeBase.exceptions";

const searchRoute = new Hono();

const SearchFilesSchema = z.object({
	searchString: z.string().min(1, "Search string cannot be empty"),
	workspaceId: z.string(),
	repoName: z.string(),
	branch: z.string(),
});

export type ISearchFilesSchema = z.infer<typeof SearchFilesSchema> & { userId: string };

searchRoute.post("/files", authMiddleware, async (c) => {
	try {
		const validation = SearchFilesSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const payload = {
			...validation.data,
			userId: c.get("user").userId,
		};
		const files = await searchFiles(payload);
		return c.json({ success: true, files });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 401);
		}
		if (error instanceof SearchRepoFileInDBError || error instanceof SearchKnowledgeBaseFilesInDBError) {
			return c.json({ success: false, message: error.message, error: error.cause }, 400);
		}
        return c.json({ success: false, error: "InternalServerError", message: "Something went wrong" }, 500);
	}
});

export default searchRoute;
