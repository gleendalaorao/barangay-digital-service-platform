import { CertificateStatus, CertificateType } from "@prisma/client";

export function formatCertificateType(type: CertificateType) {
  return type
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatCertificateStatus(status: CertificateStatus) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatDateTime(date?: Date | null) {
  return date ? date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) : "-";
}

export function formatDate(date?: Date | null) {
  return date ? date.toLocaleDateString("en-PH", { dateStyle: "medium" }) : "-";
}
