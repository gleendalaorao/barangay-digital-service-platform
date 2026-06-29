import { Role } from "@prisma/client";

const barangayRoles = new Set<Role>([Role.ADMIN, Role.SECRETARY, Role.CAPTAIN, Role.STAFF]);

export function isSuperAdmin(role?: Role | null) {
  return role === Role.SUPER_ADMIN;
}

export function isBarangayRole(role?: Role | null) {
  return Boolean(role && barangayRoles.has(role));
}

export function canManageBarangayUsers(role?: Role | null) {
  return role === Role.ADMIN || role === Role.CAPTAIN;
}

export function canApproveCertificates(role?: Role | null) {
  return role === Role.ADMIN || role === Role.CAPTAIN || role === Role.SECRETARY;
}
