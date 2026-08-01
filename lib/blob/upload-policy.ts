import { head } from "@vercel/blob";

export type BlobUploadKind = "image" | "document";
export type BlobUploadFolder = "identity" | "announcements" | "officials" | "services";

export type BlobUploadClientPayload = {
  kind: BlobUploadKind;
  folder: BlobUploadFolder;
};

export const blobUploadPolicies = {
  image: {
    allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    maximumSizeInBytes: 5 * 1024 * 1024,
  },
  document: {
    allowedContentTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    allowedExtensions: [".pdf", ".doc", ".docx"],
    maximumSizeInBytes: 10 * 1024 * 1024,
  },
} as const;

const allowedTargets = new Set([
  "identity:image",
  "announcements:image",
  "announcements:document",
  "officials:image",
  "services:document",
]);

export function parseBlobUploadClientPayload(value: string | null): BlobUploadClientPayload {
  let parsed: unknown;

  try {
    parsed = value ? JSON.parse(value) : null;
  } catch {
    throw new Error("Invalid upload request.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid upload request.");
  }

  const { kind, folder } = parsed as Record<string, unknown>;

  if ((kind !== "image" && kind !== "document") || !isBlobUploadFolder(folder)) {
    throw new Error("Invalid upload request.");
  }

  if (!allowedTargets.has(`${folder}:${kind}`)) {
    throw new Error("That upload type is not allowed for this destination.");
  }

  return { kind, folder };
}

export function getBlobTenantPrefix(barangayId: string, folder: BlobUploadFolder) {
  return `barangays/${sanitizePathSegment(barangayId)}/${folder}/`;
}

export function validateBlobTokenPathname(pathname: string, barangayId: string, target: BlobUploadClientPayload) {
  const prefix = getBlobTenantPrefix(barangayId, target.folder);
  const filename = pathname.slice(prefix.length);
  const extension = filename.includes(".") ? `.${filename.split(".").pop()?.toLowerCase()}` : "";

  if (!pathname.startsWith(prefix) || !filename || filename.includes("/") || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
    throw new Error("Upload pathname does not match the authenticated barangay.");
  }

  if (!blobUploadPolicies[target.kind].allowedExtensions.includes(extension as never)) {
    throw new Error(target.kind === "image" ? "Upload a JPG, PNG, or WebP image." : "Upload a PDF, DOC, or DOCX document.");
  }
}

export async function verifyBlobUploadUrl(
  url: string,
  barangayId: string,
  target: BlobUploadClientPayload,
) {
  let blob;

  try {
    blob = await head(url);
  } catch {
    throw new Error("The uploaded Blob could not be verified.");
  }

  validateVerifiedBlobMetadata(blob, barangayId, target);

  return blob;
}

export function validateVerifiedBlobMetadata(
  blob: { pathname: string; contentType: string; size: number },
  barangayId: string,
  target: BlobUploadClientPayload,
) {
  const prefix = getBlobTenantPrefix(barangayId, target.folder);
  const policy = blobUploadPolicies[target.kind];

  if (!blob.pathname.startsWith(prefix)) {
    throw new Error("The uploaded Blob does not belong to the authenticated barangay.");
  }

  if (!policy.allowedContentTypes.includes(blob.contentType as never)) {
    throw new Error("The uploaded Blob has an unsupported content type.");
  }

  if (blob.size > policy.maximumSizeInBytes) {
    throw new Error(target.kind === "image" ? "Images must be 5MB or smaller." : "Documents must be 10MB or smaller.");
  }
}

function isBlobUploadFolder(value: unknown): value is BlobUploadFolder {
  return value === "identity" || value === "announcements" || value === "officials" || value === "services";
}

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}
