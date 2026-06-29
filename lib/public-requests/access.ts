import { auth } from "@/auth";

export async function requirePublicRequestBarangaySession() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!session.user.barangayId) {
    throw new Error("PUBLIC_REQUEST_BARANGAY_CONTEXT_REQUIRED");
  }

  return {
    userId: session.user.id,
    role: session.user.role,
    barangayId: session.user.barangayId,
  };
}

export function getPublicRequestAccessMessage(error: unknown) {
  if (error instanceof Error && error.message === "PUBLIC_REQUEST_BARANGAY_CONTEXT_REQUIRED") {
    return "Select a barangay context before managing public requests.";
  }

  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return "Sign in with a barangay account to manage public requests.";
  }

  return "Public requests are unavailable right now.";
}
