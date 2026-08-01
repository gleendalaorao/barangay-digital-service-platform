import { PublicRequestStatus, Role } from "@prisma/client";

const barangayRoles = new Set<Role>([Role.ADMIN, Role.SECRETARY, Role.CAPTAIN, Role.STAFF]);

export function isSuperAdmin(role?: Role | null) {
  return role === Role.SUPER_ADMIN;
}

export function isBarangayRole(role?: Role | null) {
  return Boolean(role && barangayRoles.has(role));
}

export function canApproveCertificates(role?: Role | null) {
  return role === Role.ADMIN || role === Role.CAPTAIN;
}

export function canCreateCertificateDraft(role?: Role | null) {
  return role === Role.ADMIN || role === Role.SECRETARY || role === Role.CAPTAIN || role === Role.STAFF;
}

export function canSubmitCertificatesForApproval(role?: Role | null) {
  return role === Role.ADMIN || role === Role.SECRETARY;
}

export function canReleaseCertificates(role?: Role | null) {
  return role === Role.ADMIN || role === Role.SECRETARY;
}

export function canCancelCertificates(role?: Role | null) {
  return role === Role.ADMIN;
}

export function canUpdatePublicRequestStatus(role: Role | null | undefined, status: PublicRequestStatus) {
  if (role === Role.ADMIN) {
    return true;
  }

  if (role === Role.STAFF) {
    return status === PublicRequestStatus.UNDER_REVIEW;
  }

  if (role === Role.CAPTAIN) {
    return status === PublicRequestStatus.APPROVED || status === PublicRequestStatus.REJECTED;
  }

  if (role === Role.SECRETARY) {
    const secretaryStatuses: PublicRequestStatus[] = [
      PublicRequestStatus.UNDER_REVIEW,
      PublicRequestStatus.NEEDS_MORE_INFO,
      PublicRequestStatus.FOR_APPROVAL,
      PublicRequestStatus.READY_FOR_PICKUP,
      PublicRequestStatus.READY_FOR_DOWNLOAD,
      PublicRequestStatus.RELEASED,
    ];

    return secretaryStatuses.includes(status);
  }

  return false;
}
