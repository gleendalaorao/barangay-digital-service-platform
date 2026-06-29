"use server";

import { ResidentAccountStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { canReviewResidentVerifications, requireResidentVerificationSession } from "@/lib/resident-accounts/access";
import { formatResidentAccountName } from "@/lib/resident-accounts/format";
import { verificationReviewSchema } from "@/lib/validation/resident-account";

function parseReviewForm(formData: FormData) {
  return verificationReviewSchema.parse({
    id: formData.get("id"),
    staffNotes: formData.get("staffNotes"),
  });
}

export async function approveResidentVerification(formData: FormData) {
  const session = await requireResidentVerificationSession();

  if (!canReviewResidentVerifications(session.role)) {
    throw new Error("You do not have permission to review resident verifications.");
  }

  const parsed = parseReviewForm(formData);
  const request = await prisma.residentVerificationRequest.findFirst({
    where: {
      id: parsed.id,
      barangayId: session.barangayId,
    },
    include: {
      account: true,
    },
  });

  if (!request) {
    throw new Error("Verification request was not found.");
  }

  const matchedResident = request.account.birthDate
    ? await prisma.resident.findFirst({
        where: {
          barangayId: session.barangayId,
          firstName: { equals: request.account.firstName, mode: "insensitive" },
          lastName: { equals: request.account.lastName, mode: "insensitive" },
          birthDate: request.account.birthDate,
        },
        select: { id: true },
      })
    : null;

  const residentId =
    matchedResident?.id ??
    (
      await prisma.resident.create({
        data: {
          barangayId: session.barangayId,
          firstName: request.account.firstName,
          middleName: request.account.middleName,
          lastName: request.account.lastName,
          suffix: request.account.suffix,
          birthDate: request.account.birthDate,
          gender: request.account.gender,
          contactNumber: request.account.contactNumber,
          addressLine: request.account.addressLine,
          purok: request.account.purok,
          isActive: true,
        },
        select: { id: true },
      })
    ).id;

  await prisma.$transaction([
    prisma.residentAccount.update({
      where: { id: request.accountId },
      data: {
        residentId,
        status: ResidentAccountStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    }),
    prisma.residentVerificationRequest.update({
      where: { id: request.id },
      data: {
        residentId,
        status: ResidentAccountStatus.VERIFIED,
        staffNotes: parsed.staffNotes,
        reviewedById: session.userId,
        reviewedAt: new Date(),
      },
    }),
  ]);

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action: "RESIDENT_VERIFICATION_APPROVED",
    entity: "ResidentVerificationRequest",
    entityId: request.id,
    description: `Approved resident verification for ${formatResidentAccountName(request.account)}.`,
  });

  revalidatePath("/resident-verifications");
  revalidatePath(`/resident-verifications/${request.id}`);
  redirect(`/resident-verifications/${request.id}?approved=1`);
}

export async function rejectResidentVerification(formData: FormData) {
  await updateVerificationStatus(formData, ResidentAccountStatus.REJECTED, "RESIDENT_VERIFICATION_REJECTED", "Rejected");
}

export async function markResidentVerificationNeedsInfo(formData: FormData) {
  await updateVerificationStatus(formData, ResidentAccountStatus.NEEDS_MORE_INFO, "RESIDENT_VERIFICATION_NEEDS_MORE_INFO", "Requested more information for");
}

async function updateVerificationStatus(
  formData: FormData,
  status: ResidentAccountStatus,
  action: string,
  actionLabel: string,
) {
  const session = await requireResidentVerificationSession();

  if (!canReviewResidentVerifications(session.role)) {
    throw new Error("You do not have permission to review resident verifications.");
  }

  const parsed = parseReviewForm(formData);
  const request = await prisma.residentVerificationRequest.findFirst({
    where: {
      id: parsed.id,
      barangayId: session.barangayId,
    },
    include: {
      account: true,
    },
  });

  if (!request) {
    throw new Error("Verification request was not found.");
  }

  await prisma.$transaction([
    prisma.residentAccount.update({
      where: { id: request.accountId },
      data: { status },
    }),
    prisma.residentVerificationRequest.update({
      where: { id: request.id },
      data: {
        status,
        staffNotes: parsed.staffNotes,
        reviewedById: session.userId,
        reviewedAt: new Date(),
      },
    }),
  ]);

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action,
    entity: "ResidentVerificationRequest",
    entityId: request.id,
    description: `${actionLabel} resident verification for ${formatResidentAccountName(request.account)}.`,
  });

  revalidatePath("/resident-verifications");
  revalidatePath(`/resident-verifications/${request.id}`);
  redirect(`/resident-verifications/${request.id}?updated=1`);
}
