import Link from "next/link";
import { Building2, FileCheck2, Plus, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { formatPlatformAddress, formatPlatformDate } from "@/lib/platform/format";
import { getPlatformAccessMessage, requirePlatformAdmin } from "@/lib/platform/workspace";

export default async function PlatformDashboardPage() {
  try {
    await requirePlatformAdmin();
  } catch (error) {
    return (
      <DashboardShell>
        <PlatformFrame>
          <AccessNotice message={getPlatformAccessMessage(error)} />
        </PlatformFrame>
      </DashboardShell>
    );
  }

  const [totalBarangays, totalBarangayUsers, totalResidents, totalCertificates, recentBarangays] = await Promise.all([
    prisma.barangay.count(),
    prisma.user.count({
      where: {
        barangayId: { not: null },
      },
    }),
    prisma.resident.count(),
    prisma.certificateRequest.count(),
    prisma.barangay.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        _count: {
          select: {
            users: true,
            residents: true,
          },
        },
      },
    }),
  ]);

  return (
    <DashboardShell>
      <PlatformFrame
        action={
          <Link href="/platform/barangays/new" className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Barangay
          </Link>
        }
      >
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total barangays" value={totalBarangays} helper="Tenant workspaces created" icon={Building2} />
          <StatCard label="Active barangays" value={totalBarangays} helper="All current tenant workspaces" icon={Building2} tone="blue" />
          <StatCard label="Barangay users" value={totalBarangayUsers} helper="Users assigned to tenants" icon={Users} tone="blue" />
          <StatCard label="Total residents" value={totalResidents} helper="Across all tenant registries" icon={Users} tone="gold" />
          <StatCard label="Certificates" value={totalCertificates} helper="Across all tenant logbooks" icon={FileCheck2} />
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Recent Barangays</h2>
              <p className="mt-1 text-sm text-slate-500">Newest tenant workspaces ready for setup or review.</p>
            </div>
            <Link href="/platform/barangays" className="text-sm font-semibold text-emerald-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentBarangays.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-500">No barangay tenants yet.</p>
            ) : (
              recentBarangays.map((barangay) => (
                <Link key={barangay.id} href={`/platform/barangays/${barangay.id}`} className="block px-5 py-4 hover:bg-slate-50">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-semibold text-slate-950">{barangay.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatPlatformAddress(barangay)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <StatusBadge tone="success">Active</StatusBadge>
                      <span>{barangay._count.users} users</span>
                      <span>{barangay._count.residents} residents</span>
                      <span>Created {formatPlatformDate(barangay.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </PlatformFrame>
    </DashboardShell>
  );
}

function PlatformFrame({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Platform"
        title="Platform Administration"
        description="Manage barangay tenant workspaces before billing or subscriptions are introduced."
        action={action}
      />
      {children}
    </div>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
