import { Hono } from "hono";
import { uploadFileToAWS, uploadFileToGCP } from "../../controller/service.controller";
import { UploadFileToAWSError, UploadFileToGCPError, UploadFileToGCPServiceError, UploadFileToS3ServiceError } from "../../exceptions/service.exceptions";

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
		const file = payload.get("file") as File;
		const uploadLink = await uploadFileToAWS({ file, workspaceId: "default-workspace" });
		return c.json({ success: true, uploadLink });
	} catch (error) {
		if (error instanceof UploadFileToAWSError || error instanceof UploadFileToS3ServiceError) {
			return c.json({ success: false, message: error.message, error: error.cause }, 400);
		}
		return c.json({ success: false, message: "Something went wrong", error }, 500);
	}
});

export default serviceRoute;