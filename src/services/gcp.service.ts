import { Storage } from "@google-cloud/storage";
import { UploadFileToGCPServiceError } from "../exceptions/service.exceptions";

export async function uploadFileToGCPService(payload: { filePath: string, fileName: string }) {
    try {
        const storage = new Storage({
            projectId: "mtech-project-colabai-485709",
            keyFilename: "mtech-project-colabai-485709-3ca381065f86.json",
        });
        await storage.bucket(process.env.GCP_BUCKET_NAME ?? "dummy").upload(payload.filePath, {
            destination: payload.fileName,
        })
    } catch (error) {
        throw new UploadFileToGCPServiceError("Failed to upload file to GCP", { cause: (error as Error).message });
    }
}