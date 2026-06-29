import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type AuditEventInput = {
  barangayId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  description: string;
  ipAddress?: string | null;
};

export async function logAuditEvent(input: AuditEventInput) {
  try {
    const session = input.userId ? null : await auth();

    await prisma.auditLog.create({
      data: {
        barangayId: input.barangayId ?? null,
        userId: input.userId ?? session?.user?.id ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        ipAddress: input.ipAddress ?? null,
        metadata: {
          description: input.description,
        },
      },
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}

export function getAuditDescription(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "-";
  }

  const description = (metadata as { description?: unknown }).description;
  return typeof description === "string" && description.trim() ? description : "-";
}
