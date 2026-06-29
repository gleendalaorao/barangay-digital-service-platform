import { prisma } from "@/lib/prisma";
import { formatCertificateStatus, formatCertificateType, formatDate, formatDateTime } from "@/lib/certificates/format";
import { formatHouseholdAddress } from "@/lib/households/format";
import { formatPublicRequesterName, formatPublicRequestStatus } from "@/lib/public-requests/format";
import { calculateAge, formatResidentName } from "@/lib/residents/format";

export type CsvDataset = "residents" | "households" | "certificates" | "public-requests";

const datasetLabels: Record<CsvDataset, string> = {
  residents: "Residents",
  households: "Households",
  certificates: "Certificates",
  "public-requests": "Public Requests",
};

export function getCsvDatasetLabel(dataset: CsvDataset) {
  return datasetLabels[dataset];
}

export function isCsvDataset(value: string): value is CsvDataset {
  return value === "residents" || value === "households" || value === "certificates" || value === "public-requests";
}

export async function buildCsv(dataset: CsvDataset, barangayId: string) {
  switch (dataset) {
    case "residents": {
      const rows = await prisma.resident.findMany({
        where: { barangayId },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });

      return toCsv(
        ["Name", "Gender", "Age", "Civil Status", "Contact Number", "Occupation", "Purok", "Address", "Status"],
        rows.map((resident) => [
          formatResidentName(resident),
          resident.gender,
          calculateAge(resident.birthDate),
          resident.civilStatus,
          resident.contactNumber,
          resident.occupation,
          resident.purok,
          resident.addressLine,
          resident.isActive ? "Active" : "Inactive",
        ]),
      );
    }
    case "households": {
      const rows = await prisma.household.findMany({
        where: { barangayId },
        include: { headResident: true, _count: { select: { residents: true } } },
        orderBy: { householdNo: "asc" },
      });

      return toCsv(
        ["Household Number", "Household Head", "Purok", "Address", "Members", "Status"],
        rows.map((household) => [
          household.householdNo,
          household.headResident ? formatResidentName(household.headResident) : "",
          household.purok,
          formatHouseholdAddress(household),
          household._count.residents,
          household.isActive ? "Active" : "Inactive",
        ]),
      );
    }
    case "certificates": {
      const rows = await prisma.certificateRequest.findMany({
        where: { barangayId },
        include: { resident: true, requestedBy: true, approvedBy: true },
        orderBy: { createdAt: "desc" },
      });

      return toCsv(
        ["Control Number", "Resident", "Type", "Purpose", "Status", "Issued", "Released", "Prepared By", "Approved By"],
        rows.map((certificate) => [
          certificate.controlNumber,
          certificate.resident ? formatResidentName(certificate.resident) : "",
          formatCertificateType(certificate.certificateType),
          certificate.purpose,
          formatCertificateStatus(certificate.status),
          formatDate(certificate.issuedAt),
          formatDate(certificate.releasedAt),
          certificate.requestedBy?.name,
          certificate.approvedBy?.name,
        ]),
      );
    }
    case "public-requests": {
      const rows = await prisma.publicDocumentRequest.findMany({
        where: { barangayId },
        orderBy: { submittedAt: "desc" },
      });

      return toCsv(
        ["Request Number", "Requester", "Type", "Mobile", "Email", "Purok", "Purpose", "Status", "Submitted"],
        rows.map((request) => [
          request.trackingCode,
          formatPublicRequesterName(request),
          formatCertificateType(request.certificateType),
          request.requesterMobile,
          request.requesterEmail,
          request.purok,
          request.purpose,
          formatPublicRequestStatus(request.status),
          formatDateTime(request.submittedAt),
        ]),
      );
    }
  }
}

function toCsv(headers: string[], rows: unknown[][]) {
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = value instanceof Date ? value.toISOString() : String(value);
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}
