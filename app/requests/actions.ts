"use server";

import { PublicRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { canUpdatePublicRequestStatus } from "@/lib/auth/roles";
import { logAuditEvent } from "@/lib/audit";
import { requirePublicRequestBarangaySession } from "@/lib/public-requests/access";
import { prisma } from "@/lib/prisma";

const reviewedStatuses: PublicRequestStatus[] = [
  PublicRequestStatus.UNDER_REVIEW,
  PublicRequestStatus.NEEDS_MORE_INFO,
  PublicRequestStatus.FOR_APPROVAL,
  PublicRequestStatus.APPROVED,
  PublicRequestStatus.REJECTED,
];

const completedStatuses: PublicRequestStatus[] = [
  PublicRequestStatus.READY_FOR_PICKUP,
  PublicRequestStatus.READY_FOR_DOWNLOAD,
  PublicRequestStatus.RELEASED,
  PublicRequestStatus.REJECTED,
  PublicRequestStatus.CANCELLED,
];

export async function updatePublicRequestStatus(status: PublicRequestStatus, formData: FormData) {
  const session = await requirePublicRequestBarangaySession();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Request id is required.");
  }

  if (!canUpdatePublicRequestStatus(session.role, status)) {
    throw new Error("You do not have permission to perform this request action.");
  }

  await prisma.publicDocumentRequest.update({
    where: {
      id,
      barangayId: session.barangayId,
    },
    data: {
      status,
      reviewedAt: reviewedStatuses.includes(status) ? new Date() : undefined,
      completedAt: completedStatuses.includes(status) ? new Date() : undefined,
    },
  });

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action: "PUBLIC_REQUEST_STATUS_CHANGED",
    entity: "PublicDocumentRequest",
    entityId: id,
    description: `Changed public request status to ${status}.`,
  });

  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
}
