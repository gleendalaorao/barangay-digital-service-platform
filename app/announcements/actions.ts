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
import { announcementFormSchema } from "@/lib/validation/announcement";

function parseAnnouncementForm(formData: FormData) {
  const parsed = announcementFormSchema.parse({
    title: formData.get("title"),
    body: formData.get("body"),
    category: formData.get("category"),
    isPublished: formData.get("isPublished") === "on",
  });

  return {
    title: parsed.title,
    body: parsed.body,
    category: parsed.category || null,
    isPublished: parsed.isPublished,
  };
}

export async function createAnnouncement(formData: FormData) {
  const session = await requireAnnouncementSession();

  if (!canManageAnnouncements(session.role)) {
    throw new Error("You do not have permission to create announcements.");
  }

  const parsed = parseAnnouncementForm(formData);
  const announcement = await prisma.announcement.create({
    data: {
      barangayId: session.barangayId,
      createdById: session.userId,
      title: parsed.title,
      body: parsed.body,
      category: parsed.category,
      isPublished: parsed.isPublished,
      publishedAt: parsed.isPublished ? new Date() : null,
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

  revalidateAnnouncements();
  redirect(`/announcements/${announcement.id}/edit?created=1`);
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const session = await requireAnnouncementSession();

  if (!canManageAnnouncements(session.role)) {
    throw new Error("You do not have permission to edit announcements.");
  }

  const parsed = parseAnnouncementForm(formData);
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
      isPublished: parsed.isPublished,
      publishedAt: parsed.isPublished ? (current.isPublished ? undefined : new Date()) : null,
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
  redirect(`/announcements/${id}/edit?updated=1`);
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
  if (id) {
    revalidatePath(`/announcements/${id}/edit`);
  }
  revalidatePath("/b/[barangaySlug]", "page");
}
