import { Role } from "@prisma/client";
import { getEffectiveSession } from "@/lib/platform/workspace";

export async function requireResidentVerificationSession() {
  const session = await getEffectiveSession();

  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!session.user.barangayId) {
    throw new Error("RESIDENT_VERIFICATION_CONTEXT_REQUIRED");
  }

  return {
    userId: session.user.id,
    role: session.user.role,
    barangayId: session.user.barangayId,
  };
}

export function canReviewResidentVerifications(role?: Role | null) {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN || role === Role.SECRETARY || role === Role.CAPTAIN || role === Role.STAFF;
}

export function getResidentVerificationAccessMessage(error: unknown) {
  if (error instanceof Error && error.message === "RESIDENT_VERIFICATION_CONTEXT_REQUIRED") {
    return "Select a barangay context before reviewing resident verifications.";
  }

  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return "Sign in with a barangay staff account to review resident verifications.";
  }

  return "Resident verification requests are unavailable right now.";
}
