import { Hono } from "hono";
import z from "zod";
import { fetchDocumentsFromAWS, uploadFileToAWS, uploadFileToGCP } from "../../controller/service.controller";
import {
	FetchDocumentsFromAWSError,
	FetchDocumentsFromS3ServiceError,
	UploadFileToAWSError,
	UploadFileToGCPError,
	UploadFileToGCPServiceError,
	UploadFileToS3ServiceError,
} from "../../exceptions/service.exceptions";
import { authMiddleware } from "../../middleware/authentication.middleware";

const serviceRoute = new Hono();

serviceRoute.post("/gcp/upload", async (c) => {
	try {
		const payload = await c.req.formData();
		const file = payload.get("file") as File;
		const uploadLink = await uploadFileToGCP({ file });
		return c.json({ success: true, uploadLink });
	} catch (error) {
		if (error instanceof UploadFileToGCPError || error instanceof UploadFileToGCPServiceError) {
			return c.json({ success: false, message: error.message, error: error.cause }, 400);
		}
		return c.json({ success: false, message: "Something went wrong", error }, 500);
	}
});

serviceRoute.post("/aws/upload", async (c) => {
	try {
		const payload = await c.req.formData();
		const workspaceId = payload.get("workspaceId") as string;
		const file = payload.get("file") as File;
		const uploadLink = await uploadFileToAWS({ file, workspaceId });
		return c.json({ success: true, uploadLink });
	} catch (error) {
		if (error instanceof UploadFileToAWSError || error instanceof UploadFileToS3ServiceError) {
			return c.json({ success: false, message: error.message, error: error.cause }, 400);
		}
		return c.json({ success: false, message: "Something went wrong", error }, 500);
	}
});

const AWSFetchDocumentsSchema = z.object({
	workspaceId: z.string(),
});

export type IAWSFetchDocuments = z.infer<typeof AWSFetchDocumentsSchema>;

/**
 * @description Fetches all documents uploaded to AWS S3 for a given workspace.
 * @returns Array of documents with their metadata (key, url, size, lastModified, type).
 */
serviceRoute.post("/aws/fetch-documents", authMiddleware, async (c) => {
	try {
		const validation = AWSFetchDocumentsSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const payload = validation.data;
		const documents = await fetchDocumentsFromAWS(payload);
		return c.json({ success: true, documents });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 401);
		}
		if (error instanceof FetchDocumentsFromAWSError || error instanceof FetchDocumentsFromS3ServiceError) {
			return c.json({ success: false, message: error.message, error: error.cause }, 400);
		}
		return c.json({ success: false, message: "Something went wrong", error }, 500);
	}
});

export default serviceRoute;
