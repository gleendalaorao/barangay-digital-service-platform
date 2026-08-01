"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { ResidentAccountStatus } from "@prisma/client";
import { generatePublicRequestNumber } from "@/lib/public-requests/control-number";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRequestIp, RATE_LIMITS } from "@/lib/rate-limit";
import { formatPublicRequesterName } from "@/lib/public-requests/format";
import { getResidentSession } from "@/lib/resident-accounts/session";
import { publicRequestSchema } from "@/lib/validation/public-request";

function parsePublicRequestForm(formData: FormData) {
  return publicRequestSchema.parse({
    certificateType: formData.get("certificateType"),
    purpose: formData.get("purpose"),
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName"),
    lastName: formData.get("lastName"),
    suffix: formData.get("suffix"),
    birthDate: formData.get("birthDate"),
    contactNumber: formData.get("contactNumber"),
    email: formData.get("email"),
    address: formData.get("address"),
    purok: formData.get("purok"),
    notes: formData.get("notes"),
  });
}

export async function createPublicRequest(barangaySlug: string, formData: FormData) {
  const rateLimit = await checkRateLimit({
    ...RATE_LIMITS.publicRequest,
    identifier: getRequestIp(await headers()),
  });

  if (!rateLimit.allowed) {
    redirect(`/b/${barangaySlug}/request?rateLimited=${rateLimit.retryAfterSeconds}`);
  }

  const barangay = await prisma.barangay.findUnique({
    where: {
      slug: barangaySlug,
    },
    select: {
      id: true,
    },
  });

  if (!barangay) {
    throw new Error("Barangay not found.");
  }

  const parsed = parsePublicRequestForm(formData);
  const trackingCode = await generatePublicRequestNumber(barangay.id);
  const residentAccount = await getResidentSession(barangaySlug);
  const verifiedResidentAccount =
    residentAccount?.barangayId === barangay.id && residentAccount.status === ResidentAccountStatus.VERIFIED
      ? residentAccount
      : null;

  await prisma.publicDocumentRequest.create({
    data: {
      barangayId: barangay.id,
      residentId: verifiedResidentAccount?.residentId ?? undefined,
      residentAccountId: verifiedResidentAccount?.id ?? undefined,
      firstName: verifiedResidentAccount?.firstName ?? parsed.firstName,
      middleName: verifiedResidentAccount?.middleName ?? parsed.middleName,
      lastName: verifiedResidentAccount?.lastName ?? parsed.lastName,
      suffix: verifiedResidentAccount?.suffix ?? parsed.suffix,
      birthDate: verifiedResidentAccount?.birthDate ?? parsed.birthDate,
      requesterName: verifiedResidentAccount ? formatPublicRequesterName(verifiedResidentAccount) : formatPublicRequesterName(parsed),
      requesterEmail: verifiedResidentAccount?.email ?? parsed.email,
      requesterMobile: verifiedResidentAccount?.contactNumber ?? parsed.contactNumber,
      certificateType: parsed.certificateType,
      purpose: parsed.purpose,
      addressLine: verifiedResidentAccount?.addressLine ?? parsed.address,
      purok: verifiedResidentAccount?.purok ?? parsed.purok,
      notes: parsed.notes,
      trackingCode,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("public_request_submission", trackingCode, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/b/${barangaySlug}/track`,
    maxAge: 5 * 60,
  });

  redirect(`/b/${barangaySlug}/track?submitted=1`);
}
