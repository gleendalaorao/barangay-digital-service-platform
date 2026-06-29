import { AlertTriangle, Archive, DatabaseBackup, FileJson, RotateCcw, Table } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getBackupAccessMessage, requireBackupAdminSession } from "@/lib/backup/access";
import { formatDateTime } from "@/lib/certificates/format";
import { prisma } from "@/lib/prisma";
import { restoreBackupAction } from "./actions";
import { ExportButton } from "./export-button";

type BackupPageProps = {
  searchParams?: Promise<{
    restored?: string;
  }>;
};

const csvExports = [
  { href: "/settings/backup/export/residents", label: "Export Residents CSV" },
  { href: "/settings/backup/export/households", label: "Export Households CSV" },
  { href: "/settings/backup/export/certificates", label: "Export Certificates CSV" },
  { href: "/settings/backup/export/public-requests", label: "Export Public Requests CSV" },
];

export default async function BackupPage({ searchParams }: BackupPageProps) {
  const params = await searchParams;
  let session: Awaited<ReturnType<typeof requireBackupAdminSession>>;

  try {
    session = await requireBackupAdminSession();
  } catch (error) {
    return (
      <DashboardShell>
        <BackupFrame>
          <AccessNotice message={getBackupAccessMessage(error)} />
        </BackupFrame>
      </DashboardShell>
    );
  }

  const [barangay, backupLogs] = await Promise.all([
    prisma.barangay.findUnique({
      where: { id: session.barangayId },
      select: { name: true, slug: true },
    }),
    prisma.auditLog.findMany({
      where: {
        barangayId: session.barangayId,
        action: "BACKUP_CREATED",
      },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return (
    <DashboardShell>
      <BackupFrame>
        {params?.restored === "1" ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Backup restored successfully. Review the dashboard and logbooks before continuing demo operations.
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <Card
            icon={DatabaseBackup}
            title="Full Tenant Backup"
            description="Download a JSON package for this barangay. The package includes records, workflows, settings, announcements, and user profile metadata without password hashes."
          >
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-medium text-slate-950">{barangay?.name ?? "Current barangay"}</p>
              <p className="mt-1">Schema version 1 JSON backup for MVP demo recovery.</p>
            </div>
            <ExportButton href="/settings/backup/download" label="Download Backup JSON" />
          </Card>

          <Card
            icon={RotateCcw}
            title="Restore Backup"
            description="Upload a previously downloaded JSON package for this same barangay tenant."
          >
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <p>
                  Restore replaces tenant records for residents, households, certificates, public requests, announcements,
                  and barangay settings. Password hashes are never restored.
                </p>
              </div>
            </div>
            <form action={restoreBackupAction} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Backup JSON file</span>
                <input
                  type="file"
                  name="backupFile"
                  accept="application/json,.json"
                  required
                  className="mt-2 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
                />
              </label>
              <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <input type="checkbox" name="confirmRestore" className="mt-1 h-4 w-4 rounded border-slate-300" required />
                <span>I understand this will replace current tenant data with the uploaded backup contents.</span>
              </label>
              <button type="submit" className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-700">
                Restore Backup
              </button>
            </form>
          </Card>
        </section>

        <Card
          icon={Table}
          title="CSV Exports"
          description="Download spreadsheet-friendly files for demo review, manual checking, or barangay handoff."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {csvExports.map((item) => (
              <ExportButton key={item.href} href={item.href} label={item.label} />
            ))}
          </div>
        </Card>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Backup History</h2>
              <p className="mt-1 text-sm text-slate-500">Recent JSON packages created for this barangay tenant.</p>
            </div>
            <StatusBadge tone="info">{backupLogs.length} recorded</StatusBadge>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Created at</th>
                  <th>Created by</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {backupLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                      No backup packages have been created yet.
                    </td>
                  </tr>
                ) : (
                  backupLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="max-w-md truncate font-mono text-xs text-slate-700">{getFilename(log.metadata) ?? log.entityId ?? "backup.json"}</td>
                      <td className="whitespace-nowrap text-slate-700">{formatDateTime(log.createdAt)}</td>
                      <td className="text-slate-700">
                        <p className="font-medium text-slate-950">{log.user?.name ?? "System"}</p>
                        <p className="text-xs text-slate-500">{log.user?.email ?? "No user account"}</p>
                      </td>
                      <td>
                        <StatusBadge tone="success">Created</StatusBadge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </BackupFrame>
    </DashboardShell>
  );
}

function BackupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Settings"
        title="Backup & Restore"
        description="Create tenant-scoped backup packages, restore previous JSON backups, and export MVP records to CSV."
      />
      {children}
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Archive;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}

function getFilename(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const filename = (metadata as { filename?: unknown }).filename;
  return typeof filename === "string" ? filename : null;
}
