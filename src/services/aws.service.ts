import { S3, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import { UploadFileToS3ServiceError } from "../exceptions/service.exceptions";

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

		return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
	} catch (error) {
		console.log("Error uploading to S3:", error);
		throw new UploadFileToS3ServiceError("Failed to upload file to AWS S3", { cause: (error as Error).message });
	}
}
