import crypto from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

import { env } from "../config/env";
import { AppError } from "./errors";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function getCloudinary() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new AppError(503, "UPLOADS_NOT_CONFIGURED", "File uploads are not configured");
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return cloudinary;
}

function encryptionKey() {
  if (!env.MEDIA_ENCRYPTION_KEY) throw new AppError(503, "MEDIA_ENCRYPTION_NOT_CONFIGURED", "Media encryption is not configured");
  const key = Buffer.from(env.MEDIA_ENCRYPTION_KEY, "base64");
  if (key.length !== 32) throw new AppError(503, "MEDIA_ENCRYPTION_KEY_INVALID", "Media encryption key must be 32 bytes in base64");
  return key;
}

function attachmentType(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image" as const;
  if (mimeType.startsWith("video/")) return "video" as const;
  if (mimeType.startsWith("audio/")) return "audio" as const;
  return "document" as const;
}

function encrypt(data: Buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
}

export function decrypt(data: Buffer) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]);
}

export async function uploadAttachment(file: File, url: string) {
  if (file.size === 0) throw new AppError(400, "EMPTY_FILE", "File cannot be empty");
  if (file.size > MAX_FILE_SIZE) throw new AppError(413, "FILE_TOO_LARGE", "Files must be 50 MB or smaller");

  const buffer = encrypt(Buffer.from(await file.arrayBuffer()));
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    getCloudinary().uploader.upload_stream(
      { folder: "chat-app/attachments", resource_type: "raw", type: "authenticated" },
      (error, response) => {
        if (error || !response) reject(error ?? new Error("Cloudinary upload failed"));
        else resolve(response);
      },
    ).end(buffer);
  });

  return {
    url,
    publicId: result.public_id,
    version: result.version,
    encrypted: true,
    type: attachmentType(file.type),
    name: file.name,
    mimeType: file.type || undefined,
    size: file.size,
  };
}

export async function downloadAttachment(publicId: string, version?: number) {
  const deliveryUrl = getCloudinary().url(publicId, { resource_type: "raw", type: "authenticated", version, sign_url: true, secure: true });
  const response = await fetch(deliveryUrl);
  if (!response.ok) throw new AppError(404, "ATTACHMENT_NOT_FOUND", "Attachment not found");
  return decrypt(Buffer.from(await response.arrayBuffer()));
}