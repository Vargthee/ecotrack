import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";

export function isCloudStorageConfigured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID!;
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export function generateFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  return `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
}

export async function uploadToCloud(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<string> {
  if (!isCloudStorageConfigured()) {
    throw new Error("R2 cloud storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.");
  }

  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME!;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: buffer,
      ContentType: mimetype,
    })
  );

  if (publicUrl) {
    return `${publicUrl}/${filename}`;
  }
  return `https://${bucket}.r2.dev/${filename}`;
}
