import * as fs from "fs";
import * as path from "path";
import { generateNanoId } from "../utils/nano.utils";
import { uploadFileToGCPService } from "../services/gcp.service";
import {
	DeleteFileFromS3,
	DeleteFileFromS3ServiceError,
	FetchDocumentsFromAWSError,
	FetchDocumentsFromS3ServiceError,
	UploadFileToAWSError,
	UploadFileToGCPError,
	UploadFileToGCPServiceError,
	UploadFileToS3ServiceError,
} from "../exceptions/service.exceptions";
import { deleteFileFromS3Service, fetchDocumentsFromS3Service, uploadFileToS3Service } from "../services/aws.service";
import type { IAWSFetchDocuments, IDeleteFileFromS3 } from "../routes/v1/service.route";
import { deleteKnowledgeBaseFileFromDB, getFileDetailsFromDB } from "../repository/knowledgeBase.repository";
import { NotFoundError } from "../exceptions/common.exceptions";
import { DeleteKnowledgeBaseFileFromDBError, GetFileDetailsFromDBError } from "../exceptions/knowledgeBase.exceptions";

/**
 *
 * @param payload
 * @description Service controller to upload file to GCP
 * - It first converts the file to buffer and saves it temporarily in the server
 * - Then it calls the service function to upload file to GCP and gets the file URL
 * - Finally, it deletes the temporary file from the server and returns the file URL
 * @returns
 */
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

/**
 *
 * @param payload
 * @description
 * - It first converts the file to buffer and saves it temporarily in the file system
 * - Then it calls the service function to upload file to AWS S3 and gets the file URL
 * - Finally, it deletes the temporary file from the file system and returns the file URL
 * @returns File URL from AWS S3
 */
export async function uploadFileToAWS(payload: { file: File; workspaceId: string }) {
	let filePath = "";
	try {
		const bucketName = process.env.AWS_S3_BUCKET_NAME;
		if (!bucketName) {
			throw new NotFoundError("File not found");
		}
		const fileArrayBuffer = await payload.file.arrayBuffer();
		const fileBuffer = Buffer.from(fileArrayBuffer);
		filePath = path.resolve("file.pdf");
		fs.writeFileSync(filePath, fileBuffer);
		const name = payload.file.name.split(".pdf")[0];
		const fileName = `${name}-${generateNanoId()}.pdf`;
		return await uploadFileToS3Service({
			bucketName: bucketName,
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

// Function to fetch documents from AWS S3
export async function fetchDocumentsFromAWS(payload: IAWSFetchDocuments) {
	try {
		return fetchDocumentsFromS3Service(payload.workspaceId);
	} catch (error) {
		if (error instanceof FetchDocumentsFromS3ServiceError) {
			throw error;
		}
		throw new FetchDocumentsFromAWSError("Failed to fetch documents from AWS S3", { cause: (error as Error).message });
	}
}

// Function to delete file from AWS S3
export async function deleteFileFromS3(payload: IDeleteFileFromS3) {
	try {
		const bucketName = process.env.AWS_S3_BUCKET_NAME;
		if (!bucketName) {
			throw new NotFoundError("File not found");
		}
		// fetch file details from db using key to get workspaceId and validate userId with uploadedBy details in db record
		const fileDetails = await getFileDetailsFromDB(payload.fileId);
		if (fileDetails.length === 0) {
			throw new NotFoundError("File not found in DB");
		}
		// if valid, proceed to delete file from S3 and delete record from db
		await Promise.all([deleteFileFromS3Service({ bucketName: bucketName, key: payload.key }), deleteKnowledgeBaseFileFromDB(payload.fileId)]);
	} catch (error) {
		if (error instanceof NotFoundError || error instanceof GetFileDetailsFromDBError || error instanceof DeleteKnowledgeBaseFileFromDBError || error instanceof DeleteFileFromS3ServiceError) {
			throw error;
		}
		throw new DeleteFileFromS3("Failed to delete file from AWS S3", { cause: (error as Error).message });
	}
}
