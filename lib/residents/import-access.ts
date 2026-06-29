import { Role } from "@prisma/client";
import { getEffectiveSession } from "@/lib/platform/workspace";

export async function requireResidentImportSession() {
  const session = await getEffectiveSession();

  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!session.user.barangayId) {
    throw new Error("RESIDENT_IMPORT_CONTEXT_REQUIRED");
  }

  return {
    userId: session.user.id,
    role: session.user.role,
    barangayId: session.user.barangayId,
  };
}

export function canImportResidents(role?: Role | null) {
  return role === Role.ADMIN || role === Role.SECRETARY;
}

export function getResidentImportAccessMessage(error: unknown) {
  if (error instanceof Error && error.message === "RESIDENT_IMPORT_CONTEXT_REQUIRED") {
    return "Select a barangay context before importing residents.";
  }

  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return "Sign in with a barangay admin or secretary account to import residents.";
  }

  return "Resident import is unavailable right now.";
}
