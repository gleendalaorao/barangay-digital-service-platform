"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { clearWorkspaceCookie, requirePlatformAdmin, setWorkspaceCookie } from "@/lib/platform/workspace";
import { barangayTenantSchema, createBarangayTenantSchema, initialAdminRole } from "@/lib/validation/platform";

function toOptionalString(value: string | undefined) {
  return value?.trim() ? value.trim() : null;
}

function parseCreateForm(formData: FormData) {
  return createBarangayTenantSchema.parse({
    name: formData.get("name"),
    municipality: formData.get("municipality"),
    province: formData.get("province"),
    region: formData.get("region"),
    slug: formData.get("slug"),
    contactEmail: formData.get("contactEmail"),
    contactNumber: formData.get("contactNumber"),
    adminName: formData.get("adminName"),
    adminEmail: formData.get("adminEmail"),
    adminPassword: formData.get("adminPassword"),
  });
}

function parseUpdateForm(formData: FormData) {
  return barangayTenantSchema.parse({
    name: formData.get("name"),
    municipality: formData.get("municipality"),
    province: formData.get("province"),
    region: formData.get("region"),
    slug: formData.get("slug"),
    contactEmail: formData.get("contactEmail"),
    contactNumber: formData.get("contactNumber"),
  });
}

export async function createBarangayTenant(formData: FormData) {
  const user = await requirePlatformAdmin();
  const parsed = parseCreateForm(formData);

  const [existingSlug, existingEmail] = await Promise.all([
    prisma.barangay.findUnique({
      where: { slug: parsed.slug },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { email: parsed.adminEmail },
      select: { id: true },
    }),
  ]);

  if (existingSlug) {
    throw new Error("Barangay slug is already in use.");
  }

  if (existingEmail) {
    throw new Error("Initial admin email is already in use.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const barangay = await tx.barangay.create({
      data: {
        name: parsed.name,
        municipality: parsed.municipality,
        province: parsed.province,
        region: parsed.region,
        slug: parsed.slug,
        contactEmail: toOptionalString(parsed.contactEmail),
        contactNumber: toOptionalString(parsed.contactNumber),
      },
      select: { id: true, name: true },
    });

    const admin = await tx.user.create({
      data: {
        barangayId: barangay.id,
        name: parsed.adminName,
        email: parsed.adminEmail,
        role: initialAdminRole,
        isActive: true,
        passwordHash: await hashPassword(parsed.adminPassword),
      },
      select: { id: true },
    });

    return { barangay, admin };
  });

  await logAuditEvent({
    barangayId: result.barangay.id,
    userId: user.id,
    action: "BARANGAY_CREATED",
    entity: "Barangay",
    entityId: result.barangay.id,
    description: `Created barangay tenant ${result.barangay.name}.`,
  });

  await logAuditEvent({
    barangayId: result.barangay.id,
    userId: user.id,
    action: "INITIAL_ADMIN_CREATED",
    entity: "User",
    entityId: result.admin.id,
    description: `Created initial admin account for ${parsed.adminEmail}.`,
  });

  revalidatePath("/platform");
  revalidatePath("/platform/barangays");
  redirect(`/platform/barangays/${result.barangay.id}?created=1`);
}

export async function updateBarangayTenant(id: string, formData: FormData) {
  const user = await requirePlatformAdmin();
  const parsed = parseUpdateForm(formData);

  const existingSlug = await prisma.barangay.findFirst({
    where: {
      slug: parsed.slug,
      id: { not: id },
    },
    select: { id: true },
  });

  if (existingSlug) {
    throw new Error("Barangay slug is already in use.");
  }

  const barangay = await prisma.barangay.update({
    where: { id },
    data: {
      name: parsed.name,
      municipality: parsed.municipality,
      province: parsed.province,
      region: parsed.region,
      slug: parsed.slug,
      contactEmail: toOptionalString(parsed.contactEmail),
      contactNumber: toOptionalString(parsed.contactNumber),
    },
    select: { id: true, name: true },
  });

  await logAuditEvent({
    barangayId: barangay.id,
    userId: user.id,
    action: "BARANGAY_UPDATED",
    entity: "Barangay",
    entityId: barangay.id,
    description: `Updated barangay tenant ${barangay.name}.`,
  });

  revalidatePath("/platform");
  revalidatePath("/platform/barangays");
  revalidatePath(`/platform/barangays/${id}`);
  redirect(`/platform/barangays/${id}?updated=1`);
}

export async function openBarangayWorkspace(id: string) {
  const user = await requirePlatformAdmin();
  const barangay = await prisma.barangay.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!barangay) {
    throw new Error("Barangay tenant was not found.");
  }

  await setWorkspaceCookie(barangay.id);

  await logAuditEvent({
    barangayId: barangay.id,
    userId: user.id,
    action: "WORKSPACE_OPENED",
    entity: "Barangay",
    entityId: barangay.id,
    description: `Opened platform workspace for ${barangay.name}.`,
  });

  redirect("/");
}

export async function exitBarangayWorkspace() {
  const user = await requirePlatformAdmin();
  await clearWorkspaceCookie();

  await logAuditEvent({
    barangayId: null,
    userId: user.id,
    action: "WORKSPACE_EXITED",
    entity: "Barangay",
    description: "Exited selected platform workspace.",
  });

  redirect("/platform");
}
