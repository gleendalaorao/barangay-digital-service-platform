import { Role } from "@prisma/client";
import { auth } from "@/auth";

export async function requireBackupAdminSession() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!session.user.barangayId) {
    throw new Error("BACKUP_CONTEXT_REQUIRED");
  }

  if (session.user.role !== Role.ADMIN) {
    throw new Error("BACKUP_ADMIN_REQUIRED");
  }

  return {
    userId: session.user.id,
    role: session.user.role,
    barangayId: session.user.barangayId,
    barangayName: session.user.barangayName,
  };
}

export function getBackupAccessMessage(error: unknown) {
  if (error instanceof Error && error.message === "BACKUP_CONTEXT_REQUIRED") {
    return "Select a barangay context before using Backup & Restore.";
  }

  if (error instanceof Error && error.message === "BACKUP_ADMIN_REQUIRED") {
    return "Only barangay admins can use Backup & Restore.";
  }

  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return "Sign in with a barangay admin account to use Backup & Restore.";
  }

  return "Backup & Restore is unavailable right now.";
}
