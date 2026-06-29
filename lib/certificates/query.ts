import { prisma } from "@/lib/prisma";

export function getCertificateForRender(id: string, barangayId: string) {
  return prisma.certificateRequest.findFirst({
    where: {
      id,
      barangayId,
    },
    include: {
      barangay: {
        include: {
          settings: true,
        },
      },
      resident: true,
      requestedBy: true,
      approvedBy: true,
    },
  });
}
