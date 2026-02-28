import * as fs from "fs";
import * as path from "path";
import { generateNanoId } from "../utils/nano.utils";
import { uploadFileToGCPService } from "../services/gcp.service";
import { UploadFileToAWSError, UploadFileToGCPError, UploadFileToGCPServiceError, UploadFileToS3ServiceError } from "../exceptions/service.exceptions";
import { uploadFileToS3Service } from "../services/aws.service";

export async function uploadFileToGCP(payload: { file: File }) {
	let filePath = "";
	try {
		const fileArrayBuffer = await payload.file.arrayBuffer();
		const fileBuffer = Buffer.from(fileArrayBuffer);
		fs.writeFileSync("file.pdf", fileBuffer);
		filePath = path.resolve("file.pdf");
		const fileName = `${generateNanoId()}.pdf`;
		await uploadFileToGCPService({ filePath, fileName });
		return `https://storage.googleapis.com/${process.env.GCP_BUCKET_NAME}/${fileName}`;
	} catch (error) {
		if (error instanceof UploadFileToGCPServiceError) {
			throw error;
		}
		throw new UploadFileToGCPError("Failed to upload file to GCP", { cause: (error as Error).message });
	} finally {
		if (filePath) {
			fs.unlinkSync(filePath);
		}
	}
}

export async function uploadFileToAWS(payload: { file: File; workspaceId: string }) {
	let filePath = "";
	try {
		const fileArrayBuffer = await payload.file.arrayBuffer();
		const fileBuffer = Buffer.from(fileArrayBuffer);
		filePath = path.resolve("file.pdf");
		fs.writeFileSync(filePath, fileBuffer);
		const name = payload.file.name.split(".pdf")[0];
		const fileName = `${name}-${generateNanoId()}.pdf`;
		return await uploadFileToS3Service({
			bucketName: process.env.AWS_S3_BUCKET_NAME ?? "dummy",
			key: `${payload.workspaceId}/${fileName}`,
			filePath,
			contentType: payload.file.type,
		});
	} catch (error) {
		if (error instanceof UploadFileToS3ServiceError) {
			throw error;
		}
		throw new UploadFileToAWSError("Failed to upload file to AWS S3", { cause: (error as Error).message });
	} finally {
		if (filePath) {
			fs.unlinkSync(filePath);
		}
	}
}
