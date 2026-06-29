"use server";

import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { hasUpload, storeUpload } from "@/lib/storage";
import { canManageWebsiteContent, requireWebsiteSession } from "@/lib/website/access";
import { publicOfficialSchema, publicServiceSchema, websiteSettingsSchema } from "@/lib/validation/website";

function revalidateWebsite(slug?: string) {
  revalidatePath("/website");
  revalidatePath("/website/announcements");
  revalidatePath("/website/officials");
  revalidatePath("/website/services");
  revalidatePath("/website/settings");
  if (slug) {
    revalidatePath(`/b/${slug}`);
    revalidatePath(`/b/${slug}/announcements`);
    revalidatePath(`/b/${slug}/services`);
    revalidatePath(`/b/${slug}/contact`);
    revalidatePath(`/b/${slug}/officials`);
  }
}

export async function updateWebsiteSettings(formData: FormData) {
  const session = await requireWebsiteSession();
  if (!canManageWebsiteContent(session.role)) {
    throw new Error("Only admins and secretaries can update website settings.");
  }

  const parsed = websiteSettingsSchema.parse({
    welcomeTitle: formData.get("welcomeTitle"),
    welcomeMessage: formData.get("welcomeMessage"),
    publicServiceTagline: formData.get("publicServiceTagline"),
    logoUrl: formData.get("logoUrl"),
    sealUrl: formData.get("sealUrl"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    facebookPageUrl: formData.get("facebookPageUrl"),
    officeHours: formData.get("officeHours"),
    officeAddress: formData.get("officeAddress"),
    contactNumber: formData.get("contactNumber"),
    contactEmail: formData.get("contactEmail"),
  });
  const logoFile = formData.get("logoFile");
  const sealFile = formData.get("sealFile");
  const logoUrl = hasUpload(logoFile)
    ? await storeUpload({ barangayId: session.barangayId, file: logoFile, kind: "image", folder: "identity" })
    : formData.get("removeLogo") === "on"
      ? null
      : parsed.logoUrl;
  const sealUrl = hasUpload(sealFile)
    ? await storeUpload({ barangayId: session.barangayId, file: sealFile, kind: "image", folder: "identity" })
    : formData.get("removeSeal") === "on"
      ? null
      : parsed.sealUrl;

  const barangay = await prisma.barangay.update({
    where: { id: session.barangayId },
    data: {
      contactEmail: parsed.contactEmail,
      contactNumber: parsed.contactNumber,
      settings: {
        upsert: {
          update: {
            welcomeTitle: parsed.welcomeTitle,
            welcomeMessage: parsed.welcomeMessage,
            publicServiceTagline: parsed.publicServiceTagline,
            logoUrl,
            sealUrl,
            primaryColor: parsed.primaryColor,
            secondaryColor: parsed.secondaryColor,
            facebookPageUrl: parsed.facebookPageUrl,
            officeHours: parsed.officeHours,
            officeAddress: parsed.officeAddress,
          },
          create: {
            welcomeTitle: parsed.welcomeTitle,
            welcomeMessage: parsed.welcomeMessage,
            publicServiceTagline: parsed.publicServiceTagline,
            logoUrl,
            sealUrl,
            primaryColor: parsed.primaryColor,
            secondaryColor: parsed.secondaryColor,
            facebookPageUrl: parsed.facebookPageUrl,
            officeHours: parsed.officeHours,
            officeAddress: parsed.officeAddress,
          },
        },
      },
    },
    select: { slug: true },
  });

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action: "WEBSITE_SETTINGS_UPDATED",
    entity: "BarangaySetting",
    entityId: session.barangayId,
    description: "Updated public website settings.",
  });
  if (hasUpload(logoFile)) {
    await logAuditEvent({
      barangayId: session.barangayId,
      userId: session.userId,
      action: "WEBSITE_LOGO_UPLOADED",
      entity: "BarangaySetting",
      entityId: session.barangayId,
      description: "Uploaded public website logo.",
    });
  }
  if (hasUpload(sealFile)) {
    await logAuditEvent({
      barangayId: session.barangayId,
      userId: session.userId,
      action: "WEBSITE_SEAL_UPLOADED",
      entity: "BarangaySetting",
      entityId: session.barangayId,
      description: "Uploaded public website seal.",
    });
  }

  revalidateWebsite(barangay.slug);
}

export async function savePublicOfficial(formData: FormData) {
  const session = await requireWebsiteSession();
  if (!canManageWebsiteContent(session.role)) {
    throw new Error("Only admins and secretaries can update officials.");
  }

  const parsed = publicOfficialSchema.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    position: formData.get("position"),
    contact: formData.get("contact"),
    photoUrl: formData.get("photoUrl"),
    displayOrder: formData.get("displayOrder"),
    isPublished: formData.get("isPublished") === "on",
  });
  const photoFile = formData.get("photoFile");
  const photoUrl = hasUpload(photoFile)
    ? await storeUpload({ barangayId: session.barangayId, file: photoFile, kind: "image", folder: "officials" })
    : formData.get("removePhoto") === "on"
      ? null
      : parsed.photoUrl;
  const { id: officialId, ...officialFields } = parsed;
  const officialData = {
    ...officialFields,
    photoUrl,
  };

  const official = officialId
    ? await prisma.publicOfficial.update({
        where: { id: officialId, barangayId: session.barangayId },
        data: officialData,
      })
    : await prisma.publicOfficial.create({
        data: { ...officialData, barangayId: session.barangayId },
      });

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action: officialId ? "PUBLIC_OFFICIAL_UPDATED" : "PUBLIC_OFFICIAL_CREATED",
    entity: "PublicOfficial",
    entityId: official.id,
    description: `${officialId ? "Updated" : "Created"} public official ${official.name}.`,
  });
  if (hasUpload(photoFile)) {
    await logAuditEvent({
      barangayId: session.barangayId,
      userId: session.userId,
      action: "PUBLIC_OFFICIAL_PHOTO_UPLOADED",
      entity: "PublicOfficial",
      entityId: official.id,
      description: `Uploaded photo for official ${official.name}.`,
    });
  }

  const barangay = await prisma.barangay.findUnique({ where: { id: session.barangayId }, select: { slug: true } });
  revalidateWebsite(barangay?.slug);
}

export async function savePublicService(formData: FormData) {
  const session = await requireWebsiteSession();
  if (!canManageWebsiteContent(session.role)) {
    throw new Error("Only admins and secretaries can update services.");
  }

  const parsed = publicServiceSchema.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
    requirements: formData.get("requirements"),
    processingTime: formData.get("processingTime"),
    feeText: formData.get("feeText"),
    attachmentUrl: formData.get("attachmentUrl"),
    requestLink: formData.get("requestLink"),
    displayOrder: formData.get("displayOrder"),
    isPublished: formData.get("isPublished") === "on",
  });
  const attachmentFile = formData.get("attachmentFile");
  const attachmentUrl = hasUpload(attachmentFile)
    ? await storeUpload({ barangayId: session.barangayId, file: attachmentFile, kind: "document", folder: "services" })
    : formData.get("removeAttachment") === "on"
      ? null
      : parsed.attachmentUrl;
  const { id: serviceId, ...serviceFields } = parsed;
  const serviceData = {
    ...serviceFields,
    attachmentUrl,
  };

  const service = serviceId
    ? await prisma.publicService.update({
        where: { id: serviceId, barangayId: session.barangayId },
        data: serviceData,
      })
    : await prisma.publicService.create({
        data: { ...serviceData, barangayId: session.barangayId },
      });

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action: serviceId ? "PUBLIC_SERVICE_UPDATED" : "PUBLIC_SERVICE_CREATED",
    entity: "PublicService",
    entityId: service.id,
    description: `${serviceId ? "Updated" : "Created"} public service ${service.name}.`,
  });
  if (hasUpload(attachmentFile)) {
    await logAuditEvent({
      barangayId: session.barangayId,
      userId: session.userId,
      action: "PUBLIC_SERVICE_ATTACHMENT_UPLOADED",
      entity: "PublicService",
      entityId: service.id,
      description: `Uploaded attachment for public service ${service.name}.`,
    });
  }

  const barangay = await prisma.barangay.findUnique({ where: { id: session.barangayId }, select: { slug: true } });
  revalidateWebsite(barangay?.slug);
}
