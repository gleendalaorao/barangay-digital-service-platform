import { CertificateStatus, CertificateType, type Barangay, type BarangaySetting, type CertificateRequest, type Resident, type User } from "@prisma/client";
import { formatBarangayDisplayName } from "@/lib/barangay-display";
import { formatCertificateType, formatDate } from "@/lib/certificates/format";
import { formatResidentName } from "@/lib/residents/format";

export type CertificateRenderData = CertificateRequest & {
  barangay: Barangay & {
    settings: BarangaySetting | null;
  };
  resident: Resident | null;
  requestedBy: User | null;
  approvedBy: User | null;
};

export type CertificateDocument = {
  title: string;
  barangayName: string;
  municipalityLine: string;
  headerLines: string[];
  officeAddress: string;
  controlNumber: string;
  residentName: string;
  residentAddress: string;
  certificateType: string;
  purpose: string;
  body: string[];
  issuedDate: string;
  preparedBy: string;
  approvedBy: string;
  secretaryName: string;
  treasurerName: string;
  captainName: string;
  footerNote?: string;
  logoUrl?: string;
  sealUrl?: string;
  verificationUrl: string;
  status: CertificateStatus;
};

export function canExportCertificate(status: CertificateStatus) {
  return status === CertificateStatus.APPROVED || status === CertificateStatus.RELEASED;
}

export function buildCertificateDocument(certificate: CertificateRenderData, verificationUrl: string): CertificateDocument {
  if (!certificate.resident) {
    throw new Error("Certificate export requires an attached resident record.");
  }

  const barangayName = formatBarangayDisplayName(certificate.barangay.name);
  const residentName = formatResidentName(certificate.resident);
  const residentAddress = [
    certificate.resident.addressLine,
    certificate.resident.addressBarangay,
    certificate.resident.city,
    certificate.resident.province,
  ]
    .filter(Boolean)
    .join(", ");
  const issuedDate = formatDate(certificate.issuedAt ?? certificate.updatedAt ?? certificate.createdAt);
  const purpose = certificate.purpose ?? "official barangay purposes";
  const title = getCertificateTitle(certificate.certificateType);
  const settings = certificate.barangay.settings;
  const municipalityLine = [certificate.barangay.municipality, certificate.barangay.province, certificate.barangay.region]
    .filter(Boolean)
    .join(", ");
  const headerLines = [
    settings?.officialHeaderLine1 ?? "Republic of the Philippines",
    settings?.officialHeaderLine2 ?? municipalityLine,
    settings?.officialHeaderLine3 ?? barangayName,
  ].filter(Boolean);
  const captainName = settings?.captainName ?? certificate.approvedBy?.name ?? "Barangay Captain";

  return {
    title,
    barangayName,
    municipalityLine,
    headerLines,
    officeAddress: settings?.officeAddress ?? `${barangayName} Hall`,
    controlNumber: certificate.controlNumber ?? "-",
    residentName,
    residentAddress,
    certificateType: formatCertificateType(certificate.certificateType),
    purpose,
    body: getCertificateBody(certificate.certificateType, {
      barangayName,
      residentName,
      residentAddress,
      purpose,
      issuedDate,
    }),
    issuedDate,
    preparedBy: certificate.requestedBy?.name ?? settings?.secretaryName ?? "Barangay Staff",
    approvedBy: certificate.approvedBy?.name ?? captainName,
    secretaryName: settings?.secretaryName ?? "Barangay Secretary",
    treasurerName: settings?.treasurerName ?? "Barangay Treasurer",
    captainName,
    footerNote: settings?.certificateFooterNote ?? undefined,
    logoUrl: settings?.logoUrl ?? undefined,
    sealUrl: settings?.sealUrl ?? undefined,
    verificationUrl,
    status: certificate.status,
  };
}

function getCertificateTitle(type: CertificateType) {
  switch (type) {
    case CertificateType.BARANGAY_CLEARANCE:
      return "Barangay Clearance";
    case CertificateType.RESIDENCY:
      return "Certificate of Residency";
    case CertificateType.INDIGENCY:
      return "Certificate of Indigency";
  }
}

function getCertificateBody(
  type: CertificateType,
  data: {
    barangayName: string;
    residentName: string;
    residentAddress: string;
    purpose: string;
    issuedDate: string;
  },
) {
  switch (type) {
    case CertificateType.BARANGAY_CLEARANCE:
      return [
        `This is to certify that ${data.residentName}, residing at ${data.residentAddress}, is known to this office as a resident of ${data.barangayName}.`,
        `Based on the records available to this barangay, this clearance is issued for ${data.purpose}.`,
        `Issued this ${data.issuedDate} at the Barangay Hall upon request of the above-named resident.`,
      ];
    case CertificateType.RESIDENCY:
      return [
        `This is to certify that ${data.residentName} is a resident of ${data.barangayName} and currently resides at ${data.residentAddress}.`,
        `This certification is issued for ${data.purpose}.`,
        `Issued this ${data.issuedDate} at the Barangay Hall upon request of the above-named resident.`,
      ];
    case CertificateType.INDIGENCY:
      return [
        `This is to certify that ${data.residentName}, residing at ${data.residentAddress}, is known to this barangay as a resident who may request assistance for ${data.purpose}.`,
        `This certification is issued based on the information available to the barangay office.`,
        `Issued this ${data.issuedDate} at the Barangay Hall upon request of the above-named resident.`,
      ];
  }
}
