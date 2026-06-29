import { getEffectiveSession } from "@/lib/platform/workspace";

export async function requireResidentBarangayId() {
  const session = await getEffectiveSession();

  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!session.user.barangayId) {
    throw new Error("RESIDENT_BARANGAY_CONTEXT_REQUIRED");
  }

  return session.user.barangayId;
}

export function getResidentAccessMessage(error: unknown) {
  if (error instanceof Error && error.message === "RESIDENT_BARANGAY_CONTEXT_REQUIRED") {
    return "Select a barangay context before managing resident records.";
  }

  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return "Sign in with a barangay account to manage resident records.";
  }

  return "Resident records are unavailable right now.";
}
