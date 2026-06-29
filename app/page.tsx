import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardActionGrid } from "@/components/dashboard/dashboard-action-grid";
import { OperationsSnapshot } from "@/components/dashboard/operations-snapshot";

export default function DashboardPage() {
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
            <div className="rounded-md border border-teal-200 bg-white px-4 py-3 text-sm text-ink-700 shadow-sm">
              Sample Barangay
            </div>
          </div>
        </section>

        <DashboardActionGrid />
        <OperationsSnapshot />
      </div>
    </DashboardShell>
  );
}
