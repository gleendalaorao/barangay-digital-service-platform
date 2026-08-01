"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { formatCertificateType, formatDateTime } from "@/lib/certificates/format";
import { formatPublicRequestStatus, getPublicRequestInstruction } from "@/lib/public-requests/format";
import { checkRateLimit, formatRateLimitMessage, getRequestIp, RATE_LIMITS } from "@/lib/rate-limit";
import { publicTrackSchema } from "@/lib/validation/public-request";

export type TrackRequestState = {
  status: "idle" | "found" | "not-found" | "invalid" | "rate-limited";
  message?: string;
  result?: {
    trackingCode: string;
    certificateType: string;
    requestStatus: string;
    submittedAt: string;
    instructions: string;
    notes: string | null;
  };
};

export const initialTrackRequestState: TrackRequestState = {
  status: "idle",
};

export async function trackPublicRequest(
  barangaySlug: string,
  _previousState: TrackRequestState,
  formData: FormData,
): Promise<TrackRequestState> {
  const requestHeaders = await headers();
  const ipRateLimit = await checkRateLimit({
    ...RATE_LIMITS.trackingByIp,
    identifier: getRequestIp(requestHeaders),
  });

  if (!ipRateLimit.allowed) {
    return {
      status: "rate-limited",
      message: formatRateLimitMessage(ipRateLimit.retryAfterSeconds),
    };
  }

  const parsed = publicTrackSchema.safeParse({
    requestNumber: formData.get("requestNumber"),
    contactNumber: formData.get("contactNumber"),
  });

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Enter a valid request number and contact number.",
    };
  }

  const normalizedTrackingCode = parsed.data.requestNumber.toUpperCase();
  const codeRateLimit = await checkRateLimit({
    ...RATE_LIMITS.trackingByCode,
    identifier: normalizedTrackingCode,
  });

  if (!codeRateLimit.allowed) {
    return {
      status: "rate-limited",
      message: formatRateLimitMessage(codeRateLimit.retryAfterSeconds),
    };
  }

  const barangay = await prisma.barangay.findUnique({
    where: { slug: barangaySlug },
    select: { id: true },
  });

  if (!barangay) {
    return {
      status: "not-found",
      message: "No request matched that request number and contact number for this barangay.",
    };
  }

  const request = await prisma.publicDocumentRequest.findFirst({
    where: {
      barangayId: barangay.id,
      trackingCode: normalizedTrackingCode,
      requesterMobile: parsed.data.contactNumber,
    },
    select: {
      trackingCode: true,
      certificateType: true,
      status: true,
      submittedAt: true,
      notes: true,
    },
  });

  if (!request) {
    return {
      status: "not-found",
      message: "No request matched that request number and contact number for this barangay.",
    };
  }

  return {
    status: "found",
    result: {
      trackingCode: request.trackingCode,
      certificateType: formatCertificateType(request.certificateType),
      requestStatus: formatPublicRequestStatus(request.status),
      submittedAt: formatDateTime(request.submittedAt),
      instructions: getPublicRequestInstruction(request.status),
      notes: request.notes,
    },
  };
}
