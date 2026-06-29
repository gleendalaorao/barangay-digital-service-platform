import { ScrollText } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { auth } from "@/auth";
import { formatDateTime } from "@/lib/certificates/format";
import { getAuditDescription } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export default async function AuditLogsPage() {
  const session = await auth();
  const barangayId = session?.user?.barangayId;

  if (!session?.user) {
    return (
      <DashboardShell>
        <AuditLogsFrame>
          <AccessNotice message="Sign in with a barangay account to view audit logs." />
        </AuditLogsFrame>
      </DashboardShell>
    );
  }

  if (!barangayId) {
    return (
      <DashboardShell>
        <AuditLogsFrame>
          <AccessNotice message="Select a barangay context before viewing tenant audit logs." />
        </AuditLogsFrame>
      </DashboardShell>
    );
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      barangayId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <DashboardShell>
      <AuditLogsFrame>
        <DataTable>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th>Date/time</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Entity ID</th>
                <th>Description</th>
                <th>IP address</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState title="No audit logs yet" description="Completed staff actions will appear here." icon={ScrollText} />
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap text-slate-700">{formatDateTime(log.createdAt)}</td>
                    <td className="min-w-48">
                      <p className="font-medium text-slate-950">{log.user?.name ?? "System"}</p>
                      <p className="text-xs text-slate-500">{log.user?.email ?? "No user account"}</p>
                    </td>
                    <td>
                      <StatusBadge tone="info">{formatAuditAction(log.action)}</StatusBadge>
                    </td>
                    <td className="whitespace-nowrap text-slate-700">{log.entity}</td>
                    <td className="max-w-44 truncate font-mono text-xs text-slate-600">{log.entityId ?? "-"}</td>
                    <td className="min-w-72 text-slate-700">{getAuditDescription(log.metadata)}</td>
                    <td className="whitespace-nowrap text-slate-600">{log.ipAddress ?? "-"}</td>
                    <td>
                      <StatusBadge>Recorded</StatusBadge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTable>
      </AuditLogsFrame>
    </DashboardShell>
  );
}

function AuditLogsFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="System"
        title="Audit Logs"
        description="Review recent tenant-scoped actions recorded for this barangay."
      />
      {children}
    </div>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}

function formatAuditAction(action: string) {
  return action
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
