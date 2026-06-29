"use server";

import { redirect } from "next/navigation";
import { generatePublicRequestNumber } from "@/lib/public-requests/control-number";
import { prisma } from "@/lib/prisma";
import { formatPublicRequesterName } from "@/lib/public-requests/format";
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

  await prisma.publicDocumentRequest.create({
    data: {
      barangayId: barangay.id,
      firstName: parsed.firstName,
      middleName: parsed.middleName,
      lastName: parsed.lastName,
      suffix: parsed.suffix,
      birthDate: parsed.birthDate,
      requesterName: formatPublicRequesterName(parsed),
      requesterEmail: parsed.email,
      requesterMobile: parsed.contactNumber,
      certificateType: parsed.certificateType,
      purpose: parsed.purpose,
      addressLine: parsed.address,
      purok: parsed.purok,
      notes: parsed.notes,
      trackingCode,
    },
  });

  redirect(`/b/${barangaySlug}/track?submitted=1&requestNumber=${encodeURIComponent(trackingCode)}`);
}
