"use client";

import { upload } from "@vercel/blob/client";
import { useState, type FormEvent, type ReactNode } from "react";
import type { BlobUploadFolder, BlobUploadKind } from "@/lib/blob/upload-policy";

export type BlobUploadField = {
  fileField: string;
  blobUrlField: string;
  folder: BlobUploadFolder;
  kind: BlobUploadKind;
};

type BlobUploadFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  barangayId: string;
  children: ReactNode;
  className?: string;
  uploadFields: BlobUploadField[];
};

export function BlobUploadForm({ action, barangayId, children, className, uploadFields }: BlobUploadFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) {
      return;
    }

    setPending(true);
    setError(undefined);

    try {
      const formData = new FormData(event.currentTarget);

      for (const field of uploadFields) {
        const file = formData.get(field.fileField);

        if (!(file instanceof File) || file.size === 0) {
          formData.delete(field.fileField);
          continue;
        }

        const pathname = buildPathname(barangayId, field.folder, file.name);
        const blob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
          clientPayload: JSON.stringify({ kind: field.kind, folder: field.folder }),
          multipart: file.size > 4 * 1024 * 1024,
        });

        formData.delete(field.fileField);
        formData.set(field.blobUrlField, blob.url);
      }

      await action(formData);
      setPending(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to upload the selected file.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className} aria-busy={pending}>
      {children}
      {pending ? <p className="mt-3 text-sm text-slate-500">Uploading and saving…</p> : null}
      {error ? <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    </form>
  );
}

function buildPathname(barangayId: string, folder: BlobUploadFolder, originalName: string) {
  const tenant = barangayId.replace(/[^a-zA-Z0-9_-]/g, "");
  const filename = originalName.replace(/[^a-zA-Z0-9._-]/g, "-") || "upload";
  return `barangays/${tenant}/${folder}/${crypto.randomUUID()}-${filename}`;
}
