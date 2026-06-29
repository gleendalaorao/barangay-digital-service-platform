import { Role } from "@prisma/client";
import { requireAnnouncementSession } from "@/lib/announcements/access";

export async function requireWebsiteSession() {
  return requireAnnouncementSession();
}

export function canManageWebsiteContent(role?: Role | null) {
  return role === Role.ADMIN || role === Role.SECRETARY;
}

export function canPublishWebsiteContent(role?: Role | null) {
  return role === Role.ADMIN || role === Role.SECRETARY || role === Role.CAPTAIN;
}
