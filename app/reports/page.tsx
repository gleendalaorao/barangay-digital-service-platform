import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PrintReportButton } from "@/components/reports/print-report-button";
import { getReportData, type CountRow } from "@/lib/reports/data";
import { formatDateTime } from "@/lib/certificates/format";

export default async function ReportsPage() {
  const report = await getReportData();

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand-700">Basic Reports</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink-900">Barangay Operations Summary</h1>
            <p className="mt-2 text-sm text-ink-500">
              Simple printable summaries for daily barangay office monitoring.
            </p>
          </div>
          {report.kind === "barangay" ? <PrintReportButton /> : null}
        </div>

        {report.kind === "platform-placeholder" ? (
          <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-semibold text-ink-900">Platform workspace</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
              Select or enter a barangay context to view tenant-specific reports. Platform-level reports will be designed
              in a later admin milestone.
            </p>
          </section>
        ) : (
          <div id="printable-report" className="space-y-6">
            <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-2 sm:flex-row">
                <div>
                  <h2 className="text-xl font-semibold text-ink-900">{report.barangayName}</h2>
                  <p className="mt-1 text-sm text-ink-500">Generated {formatDateTime(report.generatedAt)}</p>
                </div>
                <p className="text-sm font-medium text-brand-700">MVP Basic Report</p>
              </div>
            </section>

            <ReportSection title="Resident Summary">
              <MetricGrid
                items={[
                  { label: "Total active residents", value: report.residentSummary.totalActiveResidents },
                  { label: "Residents added this month", value: report.residentSummary.residentsAddedThisMonth },
                ]}
              />
              <div className="grid gap-4 lg:grid-cols-3">
                <CountTable title="Residents by gender" rows={report.residentSummary.byGender} />
                <CountTable title="Residents by purok" rows={report.residentSummary.byPurok} />
                <CountTable title="Residents by civil status" rows={report.residentSummary.byCivilStatus} />
              </div>
            </ReportSection>

            <ReportSection title="Household Summary">
              <MetricGrid
                items={[
                  { label: "Total active households", value: report.householdSummary.totalActiveHouseholds },
                  { label: "Average members per household", value: report.householdSummary.averageMembersPerHousehold },
                ]}
              />
              <CountTable title="Households by purok" rows={report.householdSummary.byPurok} />
            </ReportSection>

            <ReportSection title="Certificate Summary">
              <MetricGrid
                items={[
                  { label: "Certificates issued today", value: report.certificateSummary.issuedToday },
                  { label: "Certificates released this month", value: report.certificateSummary.releasedThisMonth },
                  { label: "Certificates pending approval", value: report.certificateSummary.pendingApproval },
                ]}
              />
              <div className="grid gap-4 lg:grid-cols-2">
                <CountTable title="Certificates by type" rows={report.certificateSummary.byType} />
                <CountTable title="Certificates by status" rows={report.certificateSummary.byStatus} />
              </div>
            </ReportSection>

            <ReportSection title="Public Request Summary">
              <MetricGrid
                items={[
                  { label: "Requests submitted today", value: report.publicRequestSummary.submittedToday },
                  { label: "Requests needing action", value: report.publicRequestSummary.needingAction },
                ]}
              />
              <div className="grid gap-4 lg:grid-cols-2">
                <CountTable title="Requests by type" rows={report.publicRequestSummary.byType} />
                <CountTable title="Requests by status" rows={report.publicRequestSummary.byStatus} />
              </div>
            </ReportSection>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      {children}
    </section>
  );
}

function MetricGrid({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-md border border-slate-200 p-4">
          <p className="text-sm text-ink-500">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink-900">{item.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

function CountTable({ title, rows }: { title: string; rows: CountRow[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      </div>
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-white text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
          <tr>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3 text-right">Count</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-4 py-5 text-center text-ink-500">
                No records found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.label}>
                <td className="px-4 py-3 text-ink-700">{row.label}</td>
                <td className="px-4 py-3 text-right font-medium text-ink-900">{row.count.toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
