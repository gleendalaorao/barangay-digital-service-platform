"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { canMutateBarangayUsers, requireUserManagementSession } from "@/lib/users/access";
import { createBarangayUserSchema, updateBarangayUserSchema } from "@/lib/validation/user-management";

function parseCreateUserForm(formData: FormData) {
  return createBarangayUserSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    temporaryPassword: formData.get("temporaryPassword"),
    isActive: formData.get("isActive"),
  });
}

function parseUpdateUserForm(formData: FormData) {
  return updateBarangayUserSchema.parse({
    name: formData.get("name"),
    role: formData.get("role"),
    resetPassword: formData.get("resetPassword"),
    isActive: formData.get("isActive"),
  });
}

export async function createBarangayUser(formData: FormData) {
  const session = await requireUserManagementSession();

  if (!canMutateBarangayUsers(session.role)) {
    throw new Error("Only barangay admins can create users.");
  }

  const parsed = parseCreateUserForm(formData);
  const existingEmail = await prisma.user.findUnique({
    where: {
      email: parsed.email,
    },
    select: {
      id: true,
    },
  });

  if (existingEmail) {
    throw new Error("Email is already used by another account.");
  }

  const user = await prisma.user.create({
    data: {
      barangayId: session.barangayId,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      isActive: parsed.isActive,
      passwordHash: await hashPassword(parsed.temporaryPassword),
    },
    select: {
      id: true,
    },
  });

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action: "USER_CREATED",
    entity: "User",
    entityId: user.id,
    description: `Created user account for ${parsed.email}.`,
  });

  revalidatePath("/users");
  redirect(`/users/${user.id}/edit?created=1`);
}

export async function updateBarangayUser(id: string, formData: FormData) {
  const session = await requireUserManagementSession();

  if (!canMutateBarangayUsers(session.role)) {
    throw new Error("Only barangay admins can edit users.");
  }

  const parsed = parseUpdateUserForm(formData);

  await prisma.user.update({
    where: {
      id,
      barangayId: session.barangayId,
    },
    data: {
      name: parsed.name,
      role: parsed.role,
      isActive: parsed.isActive,
      ...(parsed.resetPassword ? { passwordHash: await hashPassword(parsed.resetPassword) } : {}),
    },
  });

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action: "USER_UPDATED",
    entity: "User",
    entityId: id,
    description: `Updated user account for ${parsed.name}.`,
  });

  if (parsed.resetPassword) {
    await logAuditEvent({
      barangayId: session.barangayId,
      userId: session.userId,
      action: "USER_PASSWORD_RESET",
      entity: "User",
      entityId: id,
      description: "Reset user account password.",
    });
  }

  revalidatePath("/users");
  revalidatePath(`/users/${id}/edit`);
  redirect(`/users/${id}/edit?updated=1`);
}
