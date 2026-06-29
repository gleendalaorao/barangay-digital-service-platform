"use server";

import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
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
            logoUrl: parsed.logoUrl,
            sealUrl: parsed.sealUrl,
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
            logoUrl: parsed.logoUrl,
            sealUrl: parsed.sealUrl,
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

  const official = parsed.id
    ? await prisma.publicOfficial.update({
        where: { id: parsed.id, barangayId: session.barangayId },
        data: parsed,
      })
    : await prisma.publicOfficial.create({
        data: { ...parsed, barangayId: session.barangayId },
      });

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action: parsed.id ? "PUBLIC_OFFICIAL_UPDATED" : "PUBLIC_OFFICIAL_CREATED",
    entity: "PublicOfficial",
    entityId: official.id,
    description: `${parsed.id ? "Updated" : "Created"} public official ${official.name}.`,
  });

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
    requestLink: formData.get("requestLink"),
    displayOrder: formData.get("displayOrder"),
    isPublished: formData.get("isPublished") === "on",
  });

  const service = parsed.id
    ? await prisma.publicService.update({
        where: { id: parsed.id, barangayId: session.barangayId },
        data: parsed,
      })
    : await prisma.publicService.create({
        data: { ...parsed, barangayId: session.barangayId },
      });

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action: parsed.id ? "PUBLIC_SERVICE_UPDATED" : "PUBLIC_SERVICE_CREATED",
    entity: "PublicService",
    entityId: service.id,
    description: `${parsed.id ? "Updated" : "Created"} public service ${service.name}.`,
  });

  const barangay = await prisma.barangay.findUnique({ where: { id: session.barangayId }, select: { slug: true } });
  revalidateWebsite(barangay?.slug);
}
