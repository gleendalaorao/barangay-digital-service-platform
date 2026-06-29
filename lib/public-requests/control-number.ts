import { prisma } from "@/lib/prisma";

export async function generatePublicRequestNumber(barangayId: string) {
  const barangay = await prisma.barangay.findUnique({
    where: { id: barangayId },
    select: {
      id: true,
      slug: true,
      settings: {
        select: {
          certificatePrefix: true,
        },
      },
    },
  });

  const year = new Date().getFullYear();
  const codeSource = barangay?.settings?.certificatePrefix ?? barangay?.slug ?? barangayId;
  const barangayCode = codeSource.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase() || barangayId.slice(0, 6).toUpperCase();
  const prefix = `REQ-${year}-${barangayCode}-`;

  const latest = await prisma.publicDocumentRequest.findFirst({
    where: {
      barangayId,
      trackingCode: {
        startsWith: prefix,
      },
    },
    orderBy: {
      trackingCode: "desc",
    },
    select: {
      trackingCode: true,
    },
  });

  const latestNumber = latest?.trackingCode.slice(prefix.length);
  const nextNumber = latestNumber && /^\d+$/.test(latestNumber) ? Number(latestNumber) + 1 : 1;

  return `${prefix}${String(nextNumber).padStart(6, "0")}`;
}
