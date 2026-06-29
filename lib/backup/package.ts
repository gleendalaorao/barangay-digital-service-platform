import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const BACKUP_SCHEMA_VERSION = 1;

const backupSchema = z.object({
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  generatedAt: z.string().datetime(),
  barangay: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    municipality: z.string(),
    province: z.string(),
    region: z.string(),
    contactEmail: z.string().nullable(),
    contactNumber: z.string().nullable(),
  }),
  data: z.object({
    settings: z.unknown().nullable(),
    users: z.array(z.unknown()),
    residents: z.array(z.record(z.string(), z.unknown())),
    households: z.array(z.record(z.string(), z.unknown())),
    certificates: z.array(z.record(z.string(), z.unknown())),
    publicRequests: z.array(z.record(z.string(), z.unknown())),
    announcements: z.array(z.record(z.string(), z.unknown())),
  }),
});

export type BackupPackage = z.infer<typeof backupSchema>;

export async function buildBackupPackage(barangayId: string) {
  const barangay = await prisma.barangay.findUniqueOrThrow({
    where: { id: barangayId },
    select: {
      id: true,
      name: true,
      slug: true,
      municipality: true,
      province: true,
      region: true,
      contactEmail: true,
      contactNumber: true,
      settings: true,
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { email: "asc" },
      },
      residents: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
      households: { orderBy: { householdNo: "asc" } },
      certificateRequests: { orderBy: { createdAt: "asc" } },
      publicRequests: { orderBy: { submittedAt: "asc" } },
      announcements: { orderBy: { createdAt: "asc" } },
    },
  });

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    barangay: {
      id: barangay.id,
      name: barangay.name,
      slug: barangay.slug,
      municipality: barangay.municipality,
      province: barangay.province,
      region: barangay.region,
      contactEmail: barangay.contactEmail,
      contactNumber: barangay.contactNumber,
    },
    data: {
      settings: barangay.settings,
      users: barangay.users,
      residents: barangay.residents,
      households: barangay.households,
      certificates: barangay.certificateRequests,
      publicRequests: barangay.publicRequests,
      announcements: barangay.announcements,
    },
  };
}

export function parseBackupPackage(input: unknown) {
  return backupSchema.parse(input);
}

export function backupFilename(slug: string, generatedAt = new Date()) {
  const timestamp = generatedAt.toISOString().replace(/[:.]/g, "-");
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return `${safeSlug}-backup-${timestamp}.json`;
}
