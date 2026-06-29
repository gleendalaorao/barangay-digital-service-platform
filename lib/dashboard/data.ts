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
      barangaySlug: string;
      workload: TodayWorkload;
      residentInsights: ResidentInsights;
      certificateInsights: CertificateInsights;
      publicRequestInsights: PublicRequestInsights;
      latestCertificates: LatestCertificate[];
      latestPublicRequests: LatestPublicRequest[];
    };

export type DashboardMetric = {
  label: string;
  value: number;
  helper: string;
};

export type TodayWorkload = {
  pendingPublicRequests: number;
  certificatesPendingApproval: number;
  certificatesReleasedToday: number;
  requestsReadyForPickup: number;
};

export type ResidentInsights = {
  birthdaysToday: ResidentBirthday[];
  residentsAddedThisMonth: number;
  seniorsCount: number;
  residentsByPurok: PurokSummary[];
};

export type ResidentBirthday = {
  id: string;
  name: string;
  age: number | null;
  purok: string | null;
};

export type PurokSummary = {
  purok: string;
  count: number;
};

export type CertificateInsights = {
  mostRequestedTypeThisMonth: {
    type: CertificateType;
    count: number;
  } | null;
  certificatesByStatus: StatusSummary<CertificateStatus>[];
  certificateVolumeThisMonth: number;
};

export type PublicRequestInsights = {
  onlineRequestsToday: number;
  requestsNeedingAction: number;
  readyForRelease: number;
};

export type StatusSummary<TStatus extends string> = {
  status: TStatus;
  count: number;
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
  const seniorBirthDateCutoff = new Date(now.getFullYear() - 60, now.getMonth(), now.getDate());

  const [
    barangay,
    pendingPublicRequests,
    certificatesPendingApproval,
    certificatesReleasedToday,
    requestsReadyForPickup,
    birthdayCandidates,
    residentsAddedThisMonth,
    seniorsCount,
    residentsByPurok,
    certificateTypeCountsThisMonth,
    certificatesByStatus,
    certificateVolumeThisMonth,
    onlineRequestsToday,
    requestsNeedingAction,
    readyForRelease,
    latestCertificates,
    latestPublicRequests,
  ] = await Promise.all([
    prisma.barangay.findUnique({
      where: { id: barangayId },
      select: { name: true, slug: true },
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
        status: CertificateStatus.PENDING_APPROVAL,
      },
    }),
    prisma.certificateRequest.count({
      where: {
        barangayId,
        status: CertificateStatus.RELEASED,
        releasedAt: {
          gte: startOfToday,
          lt: startOfTomorrow,
        },
      },
    }),
    prisma.publicDocumentRequest.count({
      where: {
        barangayId,
        status: PublicRequestStatus.READY_FOR_PICKUP,
      },
    }),
    prisma.resident.findMany({
      where: {
        barangayId,
        isActive: true,
        birthDate: {
          not: null,
        },
      },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        suffix: true,
        birthDate: true,
        purok: true,
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
    prisma.resident.count({
      where: {
        barangayId,
        isActive: true,
        birthDate: {
          lte: seniorBirthDateCutoff,
        },
      },
    }),
    prisma.resident.groupBy({
      by: ["purok"],
      where: {
        barangayId,
        isActive: true,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          purok: "desc",
        },
      },
      take: 8,
    }),
    prisma.certificateRequest.groupBy({
      by: ["certificateType"],
      where: {
        barangayId,
        createdAt: {
          gte: startOfMonth,
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          certificateType: "desc",
        },
      },
    }),
    prisma.certificateRequest.groupBy({
      by: ["status"],
      where: { barangayId },
      _count: {
        _all: true,
      },
      orderBy: {
        status: "asc",
      },
    }),
    prisma.certificateRequest.count({
      where: {
        barangayId,
        createdAt: {
          gte: startOfMonth,
        },
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
    prisma.publicDocumentRequest.count({
      where: {
        barangayId,
        status: {
          in: [PublicRequestStatus.READY_FOR_PICKUP, PublicRequestStatus.READY_FOR_DOWNLOAD],
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

  const birthdaysToday = birthdayCandidates
    .filter((resident) => {
      if (!resident.birthDate) {
        return false;
      }

      return resident.birthDate.getMonth() === now.getMonth() && resident.birthDate.getDate() === now.getDate();
    })
    .map((resident) => ({
      id: resident.id,
      name: [resident.firstName, resident.middleName, resident.lastName, resident.suffix].filter(Boolean).join(" "),
      age: resident.birthDate ? now.getFullYear() - resident.birthDate.getFullYear() : null,
      purok: resident.purok,
    }))
    .slice(0, 6);

  const mostRequestedTypeThisMonth = certificateTypeCountsThisMonth[0]
    ? {
        type: certificateTypeCountsThisMonth[0].certificateType,
        count: certificateTypeCountsThisMonth[0]._count._all,
      }
    : null;

  return {
    kind: "barangay",
    barangayName: barangay?.name ?? "Barangay Workspace",
    barangaySlug: barangay?.slug ?? "",
    workload: {
      pendingPublicRequests,
      certificatesPendingApproval,
      certificatesReleasedToday,
      requestsReadyForPickup,
    },
    residentInsights: {
      birthdaysToday,
      residentsAddedThisMonth,
      seniorsCount,
      residentsByPurok: residentsByPurok.map((item) => ({
        purok: item.purok ?? "Unassigned",
        count: item._count._all,
      })),
    },
    certificateInsights: {
      mostRequestedTypeThisMonth,
      certificatesByStatus: certificatesByStatus.map((item) => ({
        status: item.status,
        count: item._count._all,
      })),
      certificateVolumeThisMonth,
    },
    publicRequestInsights: {
      onlineRequestsToday,
      requestsNeedingAction,
      readyForRelease,
    },
    latestCertificates,
    latestPublicRequests,
  };
}
