import { PublicRequestStatus } from "@prisma/client";

export function formatPublicRequestStatus(status: PublicRequestStatus) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatPublicRequesterName(request: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
}) {
  return [request.firstName, request.middleName, request.lastName, request.suffix].filter(Boolean).join(" ");
}

export function getPublicRequestInstruction(status: PublicRequestStatus) {
  switch (status) {
    case PublicRequestStatus.SUBMITTED:
      return "Your request has been submitted and is waiting for barangay staff review.";
    case PublicRequestStatus.UNDER_REVIEW:
      return "Barangay staff are reviewing your request.";
    case PublicRequestStatus.NEEDS_MORE_INFO:
      return "Please contact the barangay office. Additional information is needed.";
    case PublicRequestStatus.FOR_APPROVAL:
      return "Your request is being prepared for approval.";
    case PublicRequestStatus.APPROVED:
      return "Your request has been approved and is being prepared for release.";
    case PublicRequestStatus.READY_FOR_PICKUP:
      return "Your document is ready for pickup. Bring a valid ID when visiting the barangay hall.";
    case PublicRequestStatus.READY_FOR_DOWNLOAD:
      return "Your document is ready for download once staff provides the release method.";
    case PublicRequestStatus.RELEASED:
      return "This request has been released.";
    case PublicRequestStatus.REJECTED:
      return "This request was not approved. Please contact the barangay office for details.";
    case PublicRequestStatus.CANCELLED:
      return "This request has been cancelled.";
  }
}
