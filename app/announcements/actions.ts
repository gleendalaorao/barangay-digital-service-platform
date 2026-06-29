"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canManageAnnouncements,
  canPublishAnnouncements,
  requireAnnouncementSession,
} from "@/lib/announcements/access";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { hasUpload, storeUpload } from "@/lib/storage";
import { announcementFormSchema } from "@/lib/validation/announcement";

function parseAnnouncementForm(formData: FormData) {
  const parsed = announcementFormSchema.parse({
    title: formData.get("title"),
    body: formData.get("body"),
    category: formData.get("category"),
    featuredImageUrl: formData.get("featuredImageUrl"),
    attachmentUrl: formData.get("attachmentUrl"),
    publishedAt: formData.get("publishedAt"),
    isPublished: formData.get("isPublished") === "on",
  });

  return {
    title: parsed.title,
    body: parsed.body,
    category: parsed.category || null,
    featuredImageUrl: parsed.featuredImageUrl || null,
    attachmentUrl: parsed.attachmentUrl || null,
    publishedAt: parsed.publishedAt,
    isPublished: parsed.isPublished,
    redirectBase: String(formData.get("redirectBase") ?? "/announcements"),
  };
}

export async function createAnnouncement(formData: FormData) {
  const session = await requireAnnouncementSession();

  if (!canManageAnnouncements(session.role)) {
    throw new Error("You do not have permission to create announcements.");
  }

  const parsed = parseAnnouncementForm(formData);
  const imageFile = formData.get("featuredImageFile");
  const attachmentFile = formData.get("attachmentFile");
  const featuredImageUrl = hasUpload(imageFile)
    ? await storeUpload({ barangayId: session.barangayId, file: imageFile, kind: "image", folder: "announcements" })
    : parsed.featuredImageUrl;
  const attachmentUrl = hasUpload(attachmentFile)
    ? await storeUpload({ barangayId: session.barangayId, file: attachmentFile, kind: "document", folder: "announcements" })
    : parsed.attachmentUrl;
  const announcement = await prisma.announcement.create({
    data: {
      barangayId: session.barangayId,
      createdById: session.userId,
      title: parsed.title,
      body: parsed.body,
      category: parsed.category,
      featuredImageUrl,
      attachmentUrl,
      isPublished: parsed.isPublished,
      publishedAt: parsed.isPublished ? (parsed.publishedAt ?? new Date()) : null,
    },
    select: {
      id: true,
    },
  });

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action: "ANNOUNCEMENT_CREATED",
    entity: "Announcement",
    entityId: announcement.id,
    description: `Created announcement "${parsed.title}".`,
  });
  await logAnnouncementUploads(session.barangayId, session.userId, announcement.id, imageFile, attachmentFile);

  revalidateAnnouncements();
  redirect(`${parsed.redirectBase}/${announcement.id}/edit?created=1`);
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const session = await requireAnnouncementSession();

  if (!canManageAnnouncements(session.role)) {
    throw new Error("You do not have permission to edit announcements.");
  }

  const parsed = parseAnnouncementForm(formData);
  const imageFile = formData.get("featuredImageFile");
  const attachmentFile = formData.get("attachmentFile");
  const featuredImageUrl = hasUpload(imageFile)
    ? await storeUpload({ barangayId: session.barangayId, file: imageFile, kind: "image", folder: "announcements" })
    : formData.get("removeFeaturedImage") === "on"
      ? null
      : parsed.featuredImageUrl;
  const attachmentUrl = hasUpload(attachmentFile)
    ? await storeUpload({ barangayId: session.barangayId, file: attachmentFile, kind: "document", folder: "announcements" })
    : formData.get("removeAttachment") === "on"
      ? null
      : parsed.attachmentUrl;
  const current = await prisma.announcement.findFirst({
    where: {
      id,
      barangayId: session.barangayId,
    },
    select: {
      isPublished: true,
    },
  });

  if (!current) {
    throw new Error("Announcement not found.");
  }

  await prisma.announcement.update({
    where: {
      id,
      barangayId: session.barangayId,
    },
    data: {
      title: parsed.title,
      body: parsed.body,
      category: parsed.category,
      featuredImageUrl,
      attachmentUrl,
      isPublished: parsed.isPublished,
      publishedAt: parsed.isPublished ? (parsed.publishedAt ?? (current.isPublished ? undefined : new Date())) : null,
    },
  });

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action: "ANNOUNCEMENT_UPDATED",
    entity: "Announcement",
    entityId: id,
    description: `Updated announcement "${parsed.title}".`,
  });
  await logAnnouncementUploads(session.barangayId, session.userId, id, imageFile, attachmentFile);

  if (current.isPublished !== parsed.isPublished) {
    await logAuditEvent({
      barangayId: session.barangayId,
      userId: session.userId,
      action: parsed.isPublished ? "ANNOUNCEMENT_PUBLISHED" : "ANNOUNCEMENT_UNPUBLISHED",
      entity: "Announcement",
      entityId: id,
      description: `${parsed.isPublished ? "Published" : "Unpublished"} announcement "${parsed.title}".`,
    });
  }

  revalidateAnnouncements(id);
  redirect(`${parsed.redirectBase}/${id}/edit?updated=1`);
}

async function logAnnouncementUploads(
  barangayId: string,
  userId: string,
  announcementId: string,
  imageFile: FormDataEntryValue | null,
  attachmentFile: FormDataEntryValue | null,
) {
  if (hasUpload(imageFile)) {
    await logAuditEvent({
      barangayId,
      userId,
      action: "ANNOUNCEMENT_FILE_UPLOADED",
      entity: "Announcement",
      entityId: announcementId,
      description: "Uploaded announcement featured image.",
    });
  }

  if (hasUpload(attachmentFile)) {
    await logAuditEvent({
      barangayId,
      userId,
      action: "ANNOUNCEMENT_FILE_UPLOADED",
      entity: "Announcement",
      entityId: announcementId,
      description: "Uploaded announcement attachment.",
    });
  }
}

export async function setAnnouncementPublished(id: string, publish: boolean) {
  const session = await requireAnnouncementSession();

  if (!canPublishAnnouncements(session.role)) {
    throw new Error("You do not have permission to publish announcements.");
  }

  const announcement = await prisma.announcement.update({
    where: {
      id,
      barangayId: session.barangayId,
    },
    data: {
      isPublished: publish,
      publishedAt: publish ? new Date() : null,
    },
    select: {
      title: true,
    },
  });

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action: publish ? "ANNOUNCEMENT_PUBLISHED" : "ANNOUNCEMENT_UNPUBLISHED",
    entity: "Announcement",
    entityId: id,
    description: `${publish ? "Published" : "Unpublished"} announcement "${announcement.title}".`,
  });

  revalidateAnnouncements(id);
}

function revalidateAnnouncements(id?: string) {
  revalidatePath("/announcements");
  revalidatePath("/website");
  revalidatePath("/website/announcements");
  if (id) {
    revalidatePath(`/announcements/${id}/edit`);
    revalidatePath(`/website/announcements/${id}/edit`);
  }
  revalidatePath("/b/[barangaySlug]", "page");
  revalidatePath("/b/[barangaySlug]/announcements", "page");
}
