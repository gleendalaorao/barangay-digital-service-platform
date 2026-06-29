import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit";
import { requireBackupAdminSession } from "@/lib/backup/access";
import { backupFilename, buildBackupPackage } from "@/lib/backup/package";

export const runtime = "nodejs";

export async function GET() {
  let session: Awaited<ReturnType<typeof requireBackupAdminSession>>;

  try {
    session = await requireBackupAdminSession();
  } catch (error) {
    return backupAccessError(error);
  }

  const backup = await buildBackupPackage(session.barangayId);
  const filename = backupFilename(backup.barangay.slug, new Date(backup.generatedAt));

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action: "BACKUP_CREATED",
    entity: "Backup",
    entityId: filename,
    description: `Created backup package ${filename}.`,
    metadata: {
      filename,
      createdAt: backup.generatedAt,
      schemaVersion: backup.schemaVersion,
    },
  });

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function backupAccessError(error: unknown) {
  const message = error instanceof Error ? error.message : "BACKUP_UNAVAILABLE";

  return NextResponse.json(
    { error: message === "UNAUTHENTICATED" ? "Sign in to create backups." : "Only barangay admins can create backups." },
    { status: message === "UNAUTHENTICATED" ? 401 : 403 },
  );
}
