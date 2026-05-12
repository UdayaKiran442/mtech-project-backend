import { S3, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import { DeleteFileFromS3ServiceError, FetchDocumentsFromS3ServiceError, UploadFileToS3ServiceError } from "../exceptions/service.exceptions";

const s3 = new S3({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
	},
});

export async function uploadFileToS3Service({ bucketName, key, filePath, contentType }: { bucketName: string; key: string; filePath: string; contentType: string }) {
	try {
		const fileStream = fs.createReadStream(filePath);

		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: key,
			Body: fileStream,
			ContentType: contentType,
		});

		await s3.send(command);

		return {
			url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
			key: key,
		};
	} catch (error) {
		throw new UploadFileToS3ServiceError("Failed to upload file to AWS S3", { cause: (error as Error).message });
	}
}

export async function fetchDocumentsFromS3Service(workspaceId: string) {
	try {
		const params = {
			Bucket: process.env.AWS_S3_BUCKET_NAME ?? "dummy",
			Prefix: `${workspaceId}/`,
		};
		const command = new ListObjectsV2Command(params);
		const response = await s3.send(command);
		const documents = response.Contents?.map((item) => ({
			key: item.Key,
			url: `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`,
			size: item.Size,
			lastModified: item.LastModified,
			type: item.Key?.endsWith(".pdf") ? "pdf" : "other",
		}));
		return documents ?? [];
	} catch (error) {
		throw new FetchDocumentsFromS3ServiceError("Failed to fetch documents from AWS S3", { cause: (error as Error).message });
	}
}

export async function deleteFileFromS3Service(payload: { bucketName: string; key: string }) {
	try {
		const command = new DeleteObjectCommand({
			Bucket: payload.bucketName,
			Key: payload.key,
		});
		await s3.send(command);
	} catch (error) {
		throw new DeleteFileFromS3ServiceError("Failed to delete file from AWS S3", { cause: (error as Error).message });
	}
}
