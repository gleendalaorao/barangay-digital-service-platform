import { Role } from "@prisma/client";
import { isSuperAdmin } from "./roles";

export type TenantSessionUser = {
  id: string;
  role: Role;
  barangayId?: string | null;
};

export function requireTenantScope(user: TenantSessionUser) {
  if (isSuperAdmin(user.role)) {
    return {};
  }

  if (!user.barangayId) {
    throw new Error("Tenant-scoped access requires a barangayId.");
  }

  return { barangayId: user.barangayId };
}

export function assertSameTenant(user: TenantSessionUser, barangayId: string) {
  if (isSuperAdmin(user.role)) {
    return;
  }

  if (user.barangayId !== barangayId) {
    throw new Error("Cross-tenant access is not allowed.");
  }
}
