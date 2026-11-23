import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const BUCKET = process.env.S3_BUCKET || "apphub";

export const storage = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export function publicUrl(key: string) {
  const endpoint = (process.env.AWS_ENDPOINT_URL_S3 || "").replace(/\/$/, "");
  return `${endpoint}/${BUCKET}/${key}`;
}

export async function createUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(storage, command, { expiresIn: 900 });
}

export async function createDownloadUrl(key: string, downloadName: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${downloadName}"`,
  });
  return getSignedUrl(storage, command, { expiresIn: 300 });
}

export async function deleteObject(key: string) {
  if (!key) return;
  await storage.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export function keyFromUrl(url: string | null | undefined) {
  if (!url) return "";
  const prefix = `${(process.env.AWS_ENDPOINT_URL_S3 || "").replace(/\/$/, "")}/${BUCKET}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : "";
}
