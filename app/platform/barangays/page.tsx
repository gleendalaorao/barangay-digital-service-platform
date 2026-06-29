import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { formatPlatformAddress, formatPlatformDate } from "@/lib/platform/format";
import { requirePlatformAdmin } from "@/lib/platform/workspace";

export default async function PlatformBarangaysPage() {
  await requirePlatformAdmin();

  const barangays = await prisma.barangay.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          users: true,
          residents: true,
          certificateRequests: true,
          publicRequests: true,
        },
      },
    },
  });

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Platform"
          title="Barangay Tenants"
          description="View and manage barangay workspace profiles. Billing and subscriptions are not part of this milestone."
          action={
            <Link href="/platform/barangays/new" className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Barangay
            </Link>
          }
        />
        <DataTable>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th>Barangay</th>
                <th>Location</th>
                <th>Status</th>
                <th>Users</th>
                <th>Residents</th>
                <th>Certificates</th>
                <th>Requests</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {barangays.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState title="No barangay tenants yet" description="Create the first tenant workspace and initial admin user." icon={Building2} />
                  </td>
                </tr>
              ) : (
                barangays.map((barangay) => (
                  <tr key={barangay.id}>
                    <td>
                      <p className="font-semibold text-slate-950">{barangay.name}</p>
                      <p className="text-xs text-slate-500">/{barangay.slug}</p>
                    </td>
                    <td className="text-slate-700">{formatPlatformAddress(barangay)}</td>
                    <td>
                      <StatusBadge tone="success">Active</StatusBadge>
                    </td>
                    <td className="text-slate-700">{barangay._count.users}</td>
                    <td className="text-slate-700">{barangay._count.residents}</td>
                    <td className="text-slate-700">{barangay._count.certificateRequests}</td>
                    <td className="text-slate-700">{barangay._count.publicRequests}</td>
                    <td className="whitespace-nowrap text-slate-700">{formatPlatformDate(barangay.createdAt)}</td>
                    <td>
                      <Link href={`/platform/barangays/${barangay.id}`} className="font-medium text-emerald-700">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTable>
      </div>
    </DashboardShell>
  );
}
