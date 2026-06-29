import { CertificateStatus, CertificateType, PublicRequestStatus } from "@prisma/client";
import { getEffectiveSession } from "@/lib/platform/workspace";
import { prisma } from "@/lib/prisma";

export type ReportData =
  | {
      kind: "platform-placeholder";
      userName?: string | null;
    }
  | {
      kind: "barangay";
      barangayName: string;
      generatedAt: Date;
      residentSummary: ResidentSummary;
      householdSummary: HouseholdSummary;
      certificateSummary: CertificateSummary;
      publicRequestSummary: PublicRequestSummary;
    };

export type CountRow = {
  label: string;
  count: number;
};

type ResidentSummary = {
  totalActiveResidents: number;
  residentsAddedThisMonth: number;
  byGender: CountRow[];
  byPurok: CountRow[];
  byCivilStatus: CountRow[];
};

type HouseholdSummary = {
  totalActiveHouseholds: number;
  averageMembersPerHousehold: number;
  byPurok: CountRow[];
};

type CertificateSummary = {
  issuedToday: number;
  releasedThisMonth: number;
  pendingApproval: number;
  byType: CountRow[];
  byStatus: CountRow[];
};

type PublicRequestSummary = {
  submittedToday: number;
  needingAction: number;
  byType: CountRow[];
  byStatus: CountRow[];
};

export async function getReportData(): Promise<ReportData> {
  const session = await getEffectiveSession();

  if (!session?.user?.barangayId) {
    return {
      kind: "platform-placeholder",
      userName: session?.user?.name,
    };
  }

  const barangayId = session.user.barangayId;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    barangay,
    totalActiveResidents,
    residentsAddedThisMonth,
    residentsByGender,
    residentsByPurok,
    residentsByCivilStatus,
    totalActiveHouseholds,
    householdMembers,
    householdsByPurok,
    certificatesIssuedToday,
    certificatesReleasedThisMonth,
    certificatesPendingApproval,
    certificatesByType,
    certificatesByStatus,
    requestsSubmittedToday,
    requestsNeedingAction,
    requestsByType,
    requestsByStatus,
  ] = await Promise.all([
    prisma.barangay.findUnique({
      where: { id: barangayId },
      select: { name: true },
    }),
    prisma.resident.count({
      where: { barangayId, isActive: true },
    }),
    prisma.resident.count({
      where: {
        barangayId,
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.resident.groupBy({
      by: ["gender"],
      where: { barangayId, isActive: true },
      _count: { _all: true },
      orderBy: { gender: "asc" },
    }),
    prisma.resident.groupBy({
      by: ["purok"],
      where: { barangayId, isActive: true },
      _count: { _all: true },
      orderBy: { purok: "asc" },
    }),
    prisma.resident.groupBy({
      by: ["civilStatus"],
      where: { barangayId, isActive: true },
      _count: { _all: true },
      orderBy: { civilStatus: "asc" },
    }),
    prisma.household.count({
      where: { barangayId, isActive: true },
    }),
    prisma.resident.count({
      where: {
        barangayId,
        isActive: true,
        householdId: { not: null },
      },
    }),
    prisma.household.groupBy({
      by: ["purok"],
      where: { barangayId, isActive: true },
      _count: { _all: true },
      orderBy: { purok: "asc" },
    }),
    prisma.certificateRequest.count({
      where: {
        barangayId,
        issuedAt: { gte: startOfToday, lt: startOfTomorrow },
      },
    }),
    prisma.certificateRequest.count({
      where: {
        barangayId,
        status: CertificateStatus.RELEASED,
        releasedAt: { gte: startOfMonth },
      },
    }),
    prisma.certificateRequest.count({
      where: { barangayId, status: CertificateStatus.PENDING_APPROVAL },
    }),
    prisma.certificateRequest.groupBy({
      by: ["certificateType"],
      where: { barangayId },
      _count: { _all: true },
      orderBy: { certificateType: "asc" },
    }),
    prisma.certificateRequest.groupBy({
      by: ["status"],
      where: { barangayId },
      _count: { _all: true },
      orderBy: { status: "asc" },
    }),
    prisma.publicDocumentRequest.count({
      where: {
        barangayId,
        submittedAt: { gte: startOfToday, lt: startOfTomorrow },
      },
    }),
    prisma.publicDocumentRequest.count({
      where: {
        barangayId,
        status: {
          in: [
            PublicRequestStatus.SUBMITTED,
            PublicRequestStatus.UNDER_REVIEW,
            PublicRequestStatus.NEEDS_MORE_INFO,
            PublicRequestStatus.FOR_APPROVAL,
          ],
        },
      },
    }),
    prisma.publicDocumentRequest.groupBy({
      by: ["certificateType"],
      where: { barangayId },
      _count: { _all: true },
      orderBy: { certificateType: "asc" },
    }),
    prisma.publicDocumentRequest.groupBy({
      by: ["status"],
      where: { barangayId },
      _count: { _all: true },
      orderBy: { status: "asc" },
    }),
  ]);

  return {
    kind: "barangay",
    barangayName: barangay?.name ?? "Barangay Workspace",
    generatedAt: now,
    residentSummary: {
      totalActiveResidents,
      residentsAddedThisMonth,
      byGender: residentsByGender.map((row) => toCountRow(row.gender, row._count._all)),
      byPurok: residentsByPurok.map((row) => toCountRow(row.purok, row._count._all)),
      byCivilStatus: residentsByCivilStatus.map((row) => toCountRow(row.civilStatus, row._count._all)),
    },
    householdSummary: {
      totalActiveHouseholds,
      averageMembersPerHousehold:
        totalActiveHouseholds > 0 ? Math.round((householdMembers / totalActiveHouseholds) * 100) / 100 : 0,
      byPurok: householdsByPurok.map((row) => toCountRow(row.purok, row._count._all)),
    },
    certificateSummary: {
      issuedToday: certificatesIssuedToday,
      releasedThisMonth: certificatesReleasedThisMonth,
      pendingApproval: certificatesPendingApproval,
      byType: certificatesByType.map((row) => toCountRow(formatCertificateTypeLabel(row.certificateType), row._count._all)),
      byStatus: certificatesByStatus.map((row) => toCountRow(formatStatusLabel(row.status), row._count._all)),
    },
    publicRequestSummary: {
      submittedToday: requestsSubmittedToday,
      needingAction: requestsNeedingAction,
      byType: requestsByType.map((row) => toCountRow(formatCertificateTypeLabel(row.certificateType), row._count._all)),
      byStatus: requestsByStatus.map((row) => toCountRow(formatStatusLabel(row.status), row._count._all)),
    },
  };
}

function toCountRow(value: string | null, count: number): CountRow {
  return {
    label: value || "Not specified",
    count,
  };
}

function formatCertificateTypeLabel(type: CertificateType) {
  return type
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatStatusLabel(status: CertificateStatus | PublicRequestStatus) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
