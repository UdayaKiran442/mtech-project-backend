import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { ConvertTextToChunkServiceError, ExtractTextFromS3FileServiceError } from "../exceptions/service.exceptions";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";


export async function extractTextFromS3FileService(key: string) {
	try {
		const s3Client = new S3Client({
			region: process.env.AWS_REGION,
		});
		const bucket = process.env.AWS_S3_BUCKET_NAME;

		// Download to buffer
		const command = new GetObjectCommand({ Bucket: bucket, Key: key });
		const { Body } = await s3Client.send(command);
		if (Body) {
			const arrayBuffer = await Body.transformToByteArray();
			const buffer = Buffer.from(arrayBuffer);
			const pdfBlob = new Blob([buffer], { type: "application/pdf" });

			// Parse PDF directly
			const loader = new PDFLoader(pdfBlob);
			return (await loader.load()).map((doc) => doc.pageContent).join("\n");
		} else {
			throw new ExtractTextFromS3FileServiceError("S3 file body is empty");
		}
	} catch (error) {
		throw new ExtractTextFromS3FileServiceError("Failed to extract text from S3 file", { cause: (error as Error).message });
	}
}

export async function convertTextToChunkService(text: string){
	try {
		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 200,
			chunkOverlap: 30,
		})
		return splitter.splitText(text);
	} catch (error) {
		throw new ConvertTextToChunkServiceError("Failed to convert text to chunks", { cause: (error as Error).message });
	}
}