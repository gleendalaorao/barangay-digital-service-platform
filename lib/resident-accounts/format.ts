import { ResidentAccountStatus } from "@prisma/client";

export function formatResidentAccountStatus(status: ResidentAccountStatus) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatResidentAccountName(account: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
}) {
  return [account.firstName, account.middleName, account.lastName, account.suffix].filter(Boolean).join(" ");
}

export function getResidentStatusTone(status: ResidentAccountStatus) {
  switch (status) {
    case ResidentAccountStatus.VERIFIED:
      return "success";
    case ResidentAccountStatus.NEEDS_MORE_INFO:
    case ResidentAccountStatus.PENDING_VERIFICATION:
      return "warning";
    case ResidentAccountStatus.REJECTED:
      return "danger";
  }
}
