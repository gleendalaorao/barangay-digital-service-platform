import "server-only";

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

type UploadKind = "image" | "document";

type StoreUploadInput = {
  barangayId: string;
  file: File;
  kind: UploadKind;
  folder: "identity" | "announcements" | "officials" | "services";
};

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const documentExtensions = new Set([".pdf", ".doc", ".docx"]);
const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const documentMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const maxImageSize = 5 * 1024 * 1024;
const maxDocumentSize = 10 * 1024 * 1024;

export function hasUpload(file: FormDataEntryValue | null): file is File {
  return file instanceof File && file.size > 0;
}

export async function storeUpload({ barangayId, file, kind, folder }: StoreUploadInput) {
  validateUpload(file, kind);

  const safeBarangayId = sanitizeSegment(barangayId);
  const safeFolder = sanitizeSegment(folder);
  const extension = path.extname(file.name).toLowerCase();
  const filename = `${Date.now()}-${randomUUID()}${extension}`;
  const uploadRoot = path.join(process.cwd(), "public", "uploads");
  const directory = path.join(uploadRoot, safeBarangayId, safeFolder);
  const fullPath = path.join(directory, filename);

  if (!fullPath.startsWith(path.join(uploadRoot, safeBarangayId))) {
    throw new Error("Invalid upload path.");
  }

  await mkdir(directory, { recursive: true });
  await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));

  return `/uploads/${safeBarangayId}/${safeFolder}/${filename}`;
}

function validateUpload(file: File, kind: UploadKind) {
  const extension = path.extname(file.name).toLowerCase();
  const allowedExtensions = kind === "image" ? imageExtensions : documentExtensions;
  const allowedMimeTypes = kind === "image" ? imageMimeTypes : documentMimeTypes;
  const maxSize = kind === "image" ? maxImageSize : maxDocumentSize;

  if (!allowedExtensions.has(extension)) {
    throw new Error(kind === "image" ? "Upload a JPG, PNG, or WebP image." : "Upload a PDF, DOC, or DOCX document.");
  }

  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("The selected file type is not allowed.");
  }

  if (file.size > maxSize) {
    throw new Error(kind === "image" ? "Images must be 5MB or smaller." : "Documents must be 10MB or smaller.");
  }
}

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}
