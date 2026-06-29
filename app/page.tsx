import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardActionGrid } from "@/components/dashboard/dashboard-action-grid";
import { OperationsSnapshot } from "@/components/dashboard/operations-snapshot";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { getDashboardData } from "@/lib/dashboard/data";

export default async function DashboardPage() {
  const dashboard = await getDashboardData();

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand-700">
            Today&apos;s Barangay Work
          </p>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="max-w-3xl text-3xl font-semibold text-ink-900 sm:text-4xl">
                Digital services for the barangay counter and citizen requests.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-ink-500">
                A focused workspace for resident lookup, certificates, public requests, and daily operational records.
              </p>
            </div>
            {dashboard.kind === "barangay" ? (
              <div className="rounded-md border border-teal-200 bg-white px-4 py-3 text-sm text-ink-700 shadow-sm">
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
            <OperationsSnapshot metrics={dashboard.metrics} />
            <DashboardActionGrid />
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
