import { Role } from "@prisma/client";
import { auth } from "@/auth";

export async function requireAnnouncementSession() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!session.user.barangayId) {
    throw new Error("ANNOUNCEMENT_BARANGAY_CONTEXT_REQUIRED");
  }

  return {
    userId: session.user.id,
    role: session.user.role,
    barangayId: session.user.barangayId,
  };
}

export function canViewAnnouncements(role?: Role | null) {
  return role === Role.ADMIN || role === Role.SECRETARY || role === Role.CAPTAIN || role === Role.STAFF;
}

export function canManageAnnouncements(role?: Role | null) {
  return role === Role.ADMIN || role === Role.SECRETARY;
}

export function canPublishAnnouncements(role?: Role | null) {
  return role === Role.ADMIN || role === Role.SECRETARY || role === Role.CAPTAIN;
}

export function getAnnouncementAccessMessage(error: unknown) {
  if (error instanceof Error && error.message === "ANNOUNCEMENT_BARANGAY_CONTEXT_REQUIRED") {
    return "Select a barangay context before managing announcements.";
  }

  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return "Sign in with a barangay account to view announcements.";
  }

  return "Announcements are unavailable right now.";
}
