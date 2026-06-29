import "server-only";

import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const PLATFORM_WORKSPACE_COOKIE = "platform_workspace_barangay_id";

export async function getEffectiveSession() {
  const session = await auth();

  if (!session?.user || session.user.role !== Role.SUPER_ADMIN) {
    return session;
  }

  const cookieStore = await cookies();
  const selectedBarangayId = cookieStore.get(PLATFORM_WORKSPACE_COOKIE)?.value;

  if (!selectedBarangayId) {
    return session;
  }

  const barangay = await prisma.barangay.findUnique({
    where: { id: selectedBarangayId },
    select: { id: true, name: true },
  });

  if (!barangay) {
    return session;
  }

  return {
    ...session,
    user: {
      ...session.user,
      barangayId: barangay.id,
      barangayName: barangay.name,
    },
  };
}

export async function requirePlatformAdmin() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (session.user.role !== Role.SUPER_ADMIN) {
    throw new Error("PLATFORM_ADMIN_REQUIRED");
  }

  return session.user;
}

export async function getSelectedWorkspace() {
  const session = await auth();

  if (session?.user?.role !== Role.SUPER_ADMIN) {
    return null;
  }

  const cookieStore = await cookies();
  const selectedBarangayId = cookieStore.get(PLATFORM_WORKSPACE_COOKIE)?.value;

  if (!selectedBarangayId) {
    return null;
  }

  return prisma.barangay.findUnique({
    where: { id: selectedBarangayId },
    select: { id: true, name: true, slug: true },
  });
}

export async function setWorkspaceCookie(barangayId: string) {
  const cookieStore = await cookies();

  cookieStore.set(PLATFORM_WORKSPACE_COOKIE, barangayId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearWorkspaceCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(PLATFORM_WORKSPACE_COOKIE);
}
