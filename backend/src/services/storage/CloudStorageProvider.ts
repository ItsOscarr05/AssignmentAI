import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { StorageProvider } from "./StorageProvider";

export class CloudStorageProvider implements StorageProvider {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    if (!process.env.AWS_BUCKET_NAME) {
      throw new Error("AWS bucket name not configured");
    }

    this.bucket = process.env.AWS_BUCKET_NAME;
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async uploadFile(file: Buffer, originalName: string): Promise<string> {
    const fileExtension = path.extname(originalName);
    const key = `cloud_${uuidv4()}${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: this.getContentType(fileExtension),
    });

    await this.s3Client.send(command);
    return key;
  }

  async getFileUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    // URL expires in 15 minutes
    return await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  getStorageType(): "local" | "cloud" {
    return "cloud";
  }

  private getContentType(extension: string): string {
    const contentTypes: { [key: string]: string } = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".txt": "text/plain",
      ".xls": "application/vnd.ms-excel",
      ".xlsx":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".mp4": "video/mp4",
      ".zip": "application/zip",
      ".rar": "application/x-rar-compressed",
    };

    return contentTypes[extension.toLowerCase()] || "application/octet-stream";
  }
}
