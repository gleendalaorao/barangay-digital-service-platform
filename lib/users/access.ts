import { Role } from "@prisma/client";
import { auth } from "@/auth";

export async function requireUserManagementSession() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!session.user.barangayId) {
    throw new Error("USER_MANAGEMENT_BARANGAY_CONTEXT_REQUIRED");
  }

  return {
    userId: session.user.id,
    role: session.user.role,
    barangayId: session.user.barangayId,
  };
}

export function canViewBarangayUsers(role?: Role | null) {
  return role === Role.ADMIN;
}

export function canMutateBarangayUsers(role?: Role | null) {
  return role === Role.ADMIN;
}

export function getUserManagementAccessMessage(error: unknown) {
  if (error instanceof Error && error.message === "USER_MANAGEMENT_BARANGAY_CONTEXT_REQUIRED") {
    return "Select a barangay context before managing users.";
  }

  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return "Sign in with a barangay admin account to manage users.";
  }

  return "User management is unavailable right now.";
}
