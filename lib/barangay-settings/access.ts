import { auth } from "@/auth";

export async function requireBarangaySettingsSession() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!session.user.barangayId) {
    throw new Error("BARANGAY_SETTINGS_CONTEXT_REQUIRED");
  }

  return {
    userId: session.user.id,
    role: session.user.role,
    barangayId: session.user.barangayId,
  };
}

export function getBarangaySettingsAccessMessage(error: unknown) {
  if (error instanceof Error && error.message === "BARANGAY_SETTINGS_CONTEXT_REQUIRED") {
    return "Select a barangay context before editing barangay settings.";
  }

  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return "Sign in with a barangay account to edit barangay settings.";
  }

  return "Barangay settings are unavailable right now.";
}
