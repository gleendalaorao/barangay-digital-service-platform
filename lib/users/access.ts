import { Role } from "@prisma/client";
import type { Session } from "next-auth";
import { getEffectiveSession } from "@/lib/platform/workspace";

export async function requireUserManagementSession(currentSession?: Session | null) {
  const session = currentSession ?? (await getEffectiveSession());

  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!session.user.barangayId) {
    throw new Error("USER_MANAGEMENT_BARANGAY_CONTEXT_REQUIRED");
  }

  if (session.user.role !== Role.ADMIN) {
    throw new Error("USER_MANAGEMENT_ADMIN_REQUIRED");
  }

  return {
    userId: session.user.id,
    role: session.user.role,
    barangayId: session.user.barangayId,
    email: session.user.email,
    barangayName: session.user.barangayName,
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

  if (error instanceof Error && error.message === "USER_MANAGEMENT_ADMIN_REQUIRED") {
    return "Only barangay admins can view and manage user accounts.";
  }

  return "User management is unavailable right now.";
}
