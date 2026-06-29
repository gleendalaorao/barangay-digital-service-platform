import { auth } from "@/auth";

export async function requireCertificateSession() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!session.user.barangayId) {
    throw new Error("CERTIFICATE_BARANGAY_CONTEXT_REQUIRED");
  }

  return {
    userId: session.user.id,
    role: session.user.role,
    barangayId: session.user.barangayId,
  };
}

export function getCertificateAccessMessage(error: unknown) {
  if (error instanceof Error && error.message === "CERTIFICATE_BARANGAY_CONTEXT_REQUIRED") {
    return "Select a barangay context before managing certificate records.";
  }

  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return "Sign in with a barangay account to manage certificate records.";
  }

  return "Certificate records are unavailable right now.";
}
