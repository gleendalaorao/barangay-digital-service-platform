import { CertificateStatus, CertificateType, PublicRequestStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type DashboardData =
  | {
      kind: "platform-placeholder";
      userName?: string | null;
    }
  | {
      kind: "barangay";
      barangayName: string;
      metrics: DashboardMetric[];
      latestCertificates: LatestCertificate[];
      latestPublicRequests: LatestPublicRequest[];
    };

export type DashboardMetric = {
  label: string;
  value: number;
  helper: string;
};

export type LatestCertificate = {
  id: string;
  controlNumber: string | null;
  certificateType: CertificateType;
  status: CertificateStatus;
  createdAt: Date;
  resident: {
    firstName: string;
    middleName: string | null;
    lastName: string;
    suffix: string | null;
  } | null;
};

export type LatestPublicRequest = {
  id: string;
  trackingCode: string;
  certificateType: CertificateType;
  status: PublicRequestStatus;
  submittedAt: Date;
  requesterName: string;
};

export async function getDashboardData(): Promise<DashboardData> {
  const session = await auth();

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
    activeResidents,
    activeHouseholds,
    certificatesIssuedToday,
    certificatesPendingApproval,
    publicRequestsSubmittedToday,
    publicRequestsNeedingAction,
    certificatesReleasedThisMonth,
    residentsAddedThisMonth,
    latestCertificates,
    latestPublicRequests,
  ] = await Promise.all([
    prisma.barangay.findUnique({
      where: { id: barangayId },
      select: { name: true },
    }),
    prisma.resident.count({
      where: { barangayId, isActive: true },
    }),
    prisma.household.count({
      where: { barangayId, isActive: true },
    }),
    prisma.certificateRequest.count({
      where: {
        barangayId,
        issuedAt: {
          gte: startOfToday,
          lt: startOfTomorrow,
        },
      },
    }),
    prisma.certificateRequest.count({
      where: {
        barangayId,
        status: CertificateStatus.PENDING_APPROVAL,
      },
    }),
    prisma.publicDocumentRequest.count({
      where: {
        barangayId,
        submittedAt: {
          gte: startOfToday,
          lt: startOfTomorrow,
        },
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
    prisma.certificateRequest.count({
      where: {
        barangayId,
        status: CertificateStatus.RELEASED,
        releasedAt: {
          gte: startOfMonth,
        },
      },
    }),
    prisma.resident.count({
      where: {
        barangayId,
        createdAt: {
          gte: startOfMonth,
        },
      },
    }),
    prisma.certificateRequest.findMany({
      where: { barangayId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        controlNumber: true,
        certificateType: true,
        status: true,
        createdAt: true,
        resident: {
          select: {
            firstName: true,
            middleName: true,
            lastName: true,
            suffix: true,
          },
        },
      },
    }),
    prisma.publicDocumentRequest.findMany({
      where: { barangayId },
      orderBy: { submittedAt: "desc" },
      take: 5,
      select: {
        id: true,
        trackingCode: true,
        certificateType: true,
        status: true,
        submittedAt: true,
        requesterName: true,
      },
    }),
  ]);

  return {
    kind: "barangay",
    barangayName: barangay?.name ?? "Barangay Workspace",
    metrics: [
      { label: "Total active residents", value: activeResidents, helper: "Residents currently marked active" },
      { label: "Total active households", value: activeHouseholds, helper: "Households currently marked active" },
      { label: "Certificates issued today", value: certificatesIssuedToday, helper: "Issued date is today" },
      { label: "Certificates pending approval", value: certificatesPendingApproval, helper: "Waiting for captain/admin approval" },
      { label: "Public requests submitted today", value: publicRequestsSubmittedToday, helper: "Citizen portal requests today" },
      { label: "Public requests needing action", value: publicRequestsNeedingAction, helper: "Submitted, reviewing, info needed, or for approval" },
      { label: "Certificates released this month", value: certificatesReleasedThisMonth, helper: "Released since the first day of this month" },
      { label: "Residents added this month", value: residentsAddedThisMonth, helper: "New resident records this month" },
    ],
    latestCertificates,
    latestPublicRequests,
  };
}
