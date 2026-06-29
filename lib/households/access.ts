import { auth } from "@/auth";

export async function requireHouseholdBarangayId() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!session.user.barangayId) {
    throw new Error("HOUSEHOLD_BARANGAY_CONTEXT_REQUIRED");
  }

  return session.user.barangayId;
}

export function getHouseholdAccessMessage(error: unknown) {
  if (error instanceof Error && error.message === "HOUSEHOLD_BARANGAY_CONTEXT_REQUIRED") {
    return "Select a barangay context before managing household records.";
  }

  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return "Sign in with a barangay account to manage household records.";
  }

  return "Household records are unavailable right now.";
}
