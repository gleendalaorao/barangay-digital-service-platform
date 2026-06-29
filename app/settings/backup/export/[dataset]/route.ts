import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit";
import { requireBackupAdminSession } from "@/lib/backup/access";
import { buildCsv, getCsvDatasetLabel, isCsvDataset } from "@/lib/backup/csv";

export const runtime = "nodejs";

type ExportRouteProps = {
  params: Promise<{ dataset: string }>;
};

export async function GET(_request: Request, { params }: ExportRouteProps) {
  const { dataset } = await params;

  if (!isCsvDataset(dataset)) {
    return NextResponse.json({ error: "Unknown CSV export." }, { status: 404 });
  }

  let session: Awaited<ReturnType<typeof requireBackupAdminSession>>;

  try {
    session = await requireBackupAdminSession();
  } catch (error) {
    return backupAccessError(error);
  }

  const csv = await buildCsv(dataset, session.barangayId);
  const filename = `${dataset}-${new Date().toISOString().slice(0, 10)}.csv`;
  const label = getCsvDatasetLabel(dataset);

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action: "CSV_EXPORTED",
    entity: "Backup",
    entityId: filename,
    description: `Exported ${label} CSV.`,
    metadata: {
      filename,
      dataset,
    },
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function backupAccessError(error: unknown) {
  const message = error instanceof Error ? error.message : "BACKUP_UNAVAILABLE";

  return NextResponse.json(
    { error: message === "UNAUTHENTICATED" ? "Sign in to export CSV files." : "Only barangay admins can export CSV files." },
    { status: message === "UNAUTHENTICATED" ? 401 : 403 },
  );
}
