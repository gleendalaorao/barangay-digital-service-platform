"use server";

import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";
import { type BlobUploadFolder, type BlobUploadKind, verifyBlobUploadUrl } from "@/lib/blob/upload-policy";
import { prisma } from "@/lib/prisma";
import { requireBarangaySettingsSession } from "@/lib/barangay-settings/access";
import { barangaySettingsSchema } from "@/lib/validation/barangay-settings";

function parseSettingsForm(formData: FormData) {
  return barangaySettingsSchema.parse({
    name: formData.get("name"),
    barangayCode: formData.get("barangayCode"),
    slug: formData.get("slug"),
    region: formData.get("region"),
    province: formData.get("province"),
    municipality: formData.get("municipality"),
    officeAddress: formData.get("officeAddress"),
    contactNumber: formData.get("contactNumber"),
    email: formData.get("email"),
    officeHours: formData.get("officeHours"),
    captainName: formData.get("captainName"),
    secretaryName: formData.get("secretaryName"),
    treasurerName: formData.get("treasurerName"),
    skChairpersonName: formData.get("skChairpersonName"),
    officialHeaderLine1: formData.get("officialHeaderLine1"),
    officialHeaderLine2: formData.get("officialHeaderLine2"),
    officialHeaderLine3: formData.get("officialHeaderLine3"),
    certificateFooterNote: formData.get("certificateFooterNote"),
    logoUrl: formData.get("logoUrl"),
    sealUrl: formData.get("sealUrl"),
  });
}

export async function updateBarangaySettings(formData: FormData) {
  const session = await requireBarangaySettingsSession();
  const parsed = parseSettingsForm(formData);
  const uploadedLogo = await readVerifiedBlob(formData, "logoBlobUrl", session.barangayId, "image", "identity");
  const uploadedSeal = await readVerifiedBlob(formData, "sealBlobUrl", session.barangayId, "image", "identity");
  const logoUrl = uploadedLogo
    ? uploadedLogo.url
    : formData.get("removeLogo") === "on"
      ? null
      : parsed.logoUrl;
  const sealUrl = uploadedSeal
    ? uploadedSeal.url
    : formData.get("removeSeal") === "on"
      ? null
      : parsed.sealUrl;

  const existingSlug = await prisma.barangay.findFirst({
    where: {
      slug: parsed.slug,
      NOT: {
        id: session.barangayId,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingSlug) {
    throw new Error("That public slug is already used by another barangay.");
  }

  await prisma.$transaction([
    prisma.barangay.update({
      where: {
        id: session.barangayId,
      },
      data: {
        name: parsed.name,
        slug: parsed.slug,
        region: parsed.region,
        province: parsed.province,
        municipality: parsed.municipality,
        contactEmail: parsed.email,
        contactNumber: parsed.contactNumber,
      },
    }),
    prisma.barangaySetting.upsert({
      where: {
        barangayId: session.barangayId,
      },
      update: {
        certificatePrefix: parsed.barangayCode,
        officeAddress: parsed.officeAddress,
        officeHours: parsed.officeHours,
        captainName: parsed.captainName,
        secretaryName: parsed.secretaryName,
        treasurerName: parsed.treasurerName,
        skChairpersonName: parsed.skChairpersonName,
        officialHeaderLine1: parsed.officialHeaderLine1,
        officialHeaderLine2: parsed.officialHeaderLine2,
        officialHeaderLine3: parsed.officialHeaderLine3,
        certificateFooterNote: parsed.certificateFooterNote,
        logoUrl,
        sealUrl,
      },
      create: {
        barangayId: session.barangayId,
        certificatePrefix: parsed.barangayCode,
        officeAddress: parsed.officeAddress,
        officeHours: parsed.officeHours,
        captainName: parsed.captainName,
        secretaryName: parsed.secretaryName,
        treasurerName: parsed.treasurerName,
        skChairpersonName: parsed.skChairpersonName,
        officialHeaderLine1: parsed.officialHeaderLine1,
        officialHeaderLine2: parsed.officialHeaderLine2,
        officialHeaderLine3: parsed.officialHeaderLine3,
        certificateFooterNote: parsed.certificateFooterNote,
        logoUrl,
        sealUrl,
      },
    }),
  ]);

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action: "BARANGAY_SETTINGS_UPDATED",
    entity: "Barangay",
    entityId: session.barangayId,
    description: "Updated barangay settings and certificate identity.",
  });
  if (uploadedLogo) {
    await logAuditEvent({
      barangayId: session.barangayId,
      userId: session.userId,
      action: "WEBSITE_LOGO_UPLOADED",
      entity: "BarangaySetting",
      entityId: session.barangayId,
      description: "Uploaded public website logo.",
    });
  }
  if (uploadedSeal) {
    await logAuditEvent({
      barangayId: session.barangayId,
      userId: session.userId,
      action: "WEBSITE_SEAL_UPLOADED",
      entity: "BarangaySetting",
      entityId: session.barangayId,
      description: "Uploaded public website seal.",
    });
  }

  revalidatePath("/settings/barangay");
  revalidatePath(`/b/${parsed.slug}`);
}

async function readVerifiedBlob(
  formData: FormData,
  field: string,
  barangayId: string,
  kind: BlobUploadKind,
  folder: BlobUploadFolder,
) {
  const url = String(formData.get(field) ?? "").trim();

  if (!url) {
    return null;
  }

  return verifyBlobUploadUrl(url, barangayId, { kind, folder });
}
