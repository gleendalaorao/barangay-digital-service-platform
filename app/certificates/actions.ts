"use server";

import { CertificateStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canApproveCertificates,
  canCancelCertificates,
  canCreateCertificateDraft,
  canReleaseCertificates,
  canSubmitCertificatesForApproval,
} from "@/lib/auth/roles";
import { generateCertificateControlNumber } from "@/lib/certificates/control-number";
import { requireCertificateSession } from "@/lib/certificates/access";
import { prisma } from "@/lib/prisma";
import { certificateCreateSchema } from "@/lib/validation/certificate";

function parseCertificateForm(formData: FormData) {
  return certificateCreateSchema.parse({
    residentId: formData.get("residentId"),
    certificateType: formData.get("certificateType"),
    purpose: formData.get("purpose"),
    remarks: formData.get("remarks"),
  });
}

export async function createCertificate(formData: FormData) {
  const session = await requireCertificateSession();

  if (!canCreateCertificateDraft(session.role)) {
    throw new Error("You do not have permission to create certificate records.");
  }

  const parsed = parseCertificateForm(formData);
  const resident = await prisma.resident.findFirst({
    where: {
      id: parsed.residentId,
      barangayId: session.barangayId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!resident) {
    throw new Error("Selected resident must be active and belong to this barangay.");
  }

  const status = canSubmitCertificatesForApproval(session.role)
    ? CertificateStatus.PENDING_APPROVAL
    : CertificateStatus.DRAFT;

  const certificate = await prisma.certificateRequest.create({
    data: {
      barangayId: session.barangayId,
      residentId: parsed.residentId,
      requestedById: session.userId,
      certificateType: parsed.certificateType,
      purpose: parsed.purpose,
      remarks: parsed.remarks,
      status,
      controlNumber: await generateCertificateControlNumber(session.barangayId),
    },
    select: {
      id: true,
    },
  });

  revalidatePath("/certificates");
  redirect(`/certificates/${certificate.id}?created=1`);
}

export async function submitCertificateForApproval(formData: FormData) {
  const session = await requireCertificateSession();
  const id = getCertificateId(formData);

  if (!canSubmitCertificatesForApproval(session.role)) {
    throw new Error("You do not have permission to submit certificates for approval.");
  }

  await prisma.certificateRequest.update({
    where: {
      id,
      barangayId: session.barangayId,
      status: CertificateStatus.DRAFT,
    },
    data: {
      status: CertificateStatus.PENDING_APPROVAL,
    },
  });

  revalidateCertificate(id);
}

export async function approveCertificate(formData: FormData) {
  const session = await requireCertificateSession();
  const id = getCertificateId(formData);

  if (!canApproveCertificates(session.role)) {
    throw new Error("You do not have permission to approve certificates.");
  }

  await prisma.certificateRequest.update({
    where: {
      id,
      barangayId: session.barangayId,
      status: CertificateStatus.PENDING_APPROVAL,
    },
    data: {
      status: CertificateStatus.APPROVED,
      approvedById: session.userId,
      issuedAt: new Date(),
    },
  });

  revalidateCertificate(id);
}

export async function releaseCertificate(formData: FormData) {
  const session = await requireCertificateSession();
  const id = getCertificateId(formData);

  if (!canReleaseCertificates(session.role)) {
    throw new Error("You do not have permission to release certificates.");
  }

  await prisma.certificateRequest.update({
    where: {
      id,
      barangayId: session.barangayId,
      status: CertificateStatus.APPROVED,
    },
    data: {
      status: CertificateStatus.RELEASED,
      releasedAt: new Date(),
    },
  });

  revalidateCertificate(id);
}

export async function cancelCertificate(formData: FormData) {
  const session = await requireCertificateSession();
  const id = getCertificateId(formData);

  if (!canCancelCertificates(session.role)) {
    throw new Error("You do not have permission to cancel certificates.");
  }

  await prisma.certificateRequest.update({
    where: {
      id,
      barangayId: session.barangayId,
      status: {
        notIn: [CertificateStatus.RELEASED, CertificateStatus.CANCELLED],
      },
    },
    data: {
      status: CertificateStatus.CANCELLED,
    },
  });

  revalidateCertificate(id);
}

function getCertificateId(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Certificate id is required.");
  }

  return id;
}

function revalidateCertificate(id: string) {
  revalidatePath("/certificates");
  revalidatePath(`/certificates/${id}`);
}
