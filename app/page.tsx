import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardActionGrid } from "@/components/dashboard/dashboard-action-grid";
import { DashboardInsights } from "@/components/dashboard/dashboard-insights";
import { OperationsSnapshot } from "@/components/dashboard/operations-snapshot";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { getDashboardData } from "@/lib/dashboard/data";
import { PageHeader } from "@/components/ui/page-header";

export default async function DashboardPage() {
  const dashboard = await getDashboardData();

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <PageHeader
              eyebrow="Command Center"
              title="Barangay operations at a glance"
              description="Monitor citizen records, certificate workflows, and online requests from one tenant-isolated workspace."
            />
            {dashboard.kind === "barangay" ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                {dashboard.barangayName}
              </div>
            ) : null}
          </div>
        </section>

        {dashboard.kind === "platform-placeholder" ? (
          <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-semibold text-ink-900">Platform workspace</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
              Select or enter a barangay context to view tenant-specific daily-operation metrics. Platform-level analytics
              will be designed in a later admin milestone.
            </p>
          </section>
        ) : (
          <>
            <OperationsSnapshot workload={dashboard.workload} />
            <DashboardInsights
              residentInsights={dashboard.residentInsights}
              certificateInsights={dashboard.certificateInsights}
              publicRequestInsights={dashboard.publicRequestInsights}
            />
            <div>
              <h2 className="mb-4 text-lg font-semibold text-slate-950">Quick Actions</h2>
              <DashboardActionGrid publicPortalHref={`/b/${dashboard.barangaySlug}`} />
            </div>
            <RecentActivity
              certificates={dashboard.latestCertificates}
              publicRequests={dashboard.latestPublicRequests}
            />
          </>
        )}
      </div>
    </DashboardShell>
  );
}
