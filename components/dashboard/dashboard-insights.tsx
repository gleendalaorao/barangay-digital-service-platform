import Link from "next/link";
import type { CertificateInsights, PublicRequestInsights, ResidentInsights } from "@/lib/dashboard/data";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCertificateStatus, formatCertificateType } from "@/lib/certificates/format";
import { formatPublicRequestStatus } from "@/lib/public-requests/format";

export function DashboardInsights({
  residentInsights,
  certificateInsights,
  publicRequestInsights,
}: {
  residentInsights: ResidentInsights;
  certificateInsights: CertificateInsights;
  publicRequestInsights: PublicRequestInsights;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-3">
      <SectionCard title="Resident Insights" description="Daily registry signals for front desk work.">
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <InsightNumber label="Birthdays today" value={residentInsights.birthdaysToday.length} />
          <InsightNumber label="Added this month" value={residentInsights.residentsAddedThisMonth} />
          <InsightNumber label="Seniors 60+" value={residentInsights.seniorsCount} />
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-950">Birthdays Today</h3>
          {residentInsights.birthdaysToday.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No resident birthdays today.</p>
          ) : (
            <div className="mt-2 divide-y divide-slate-100">
              {residentInsights.birthdaysToday.map((resident) => (
                <Link key={resident.id} href={`/residents/${resident.id}`} className="block py-2 text-sm hover:text-brand-700">
                  <span className="font-medium text-slate-950">{resident.name}</span>
                  <span className="ml-2 text-slate-500">
                    {resident.age ? `${resident.age} yrs` : "Birthday"}{resident.purok ? ` | ${resident.purok}` : ""}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-950">Residents by Purok</h3>
          <SummaryBars items={residentInsights.residentsByPurok.map((item) => ({ label: item.purok, count: item.count }))} />
        </div>
      </SectionCard>

      <SectionCard title="Certificate Insights" description="This month's certificate workload.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <InsightNumber label="Volume this month" value={certificateInsights.certificateVolumeThisMonth} />
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Most requested</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {certificateInsights.mostRequestedTypeThisMonth
                ? formatCertificateType(certificateInsights.mostRequestedTypeThisMonth.type)
                : "No requests yet"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {certificateInsights.mostRequestedTypeThisMonth
                ? `${certificateInsights.mostRequestedTypeThisMonth.count.toLocaleString()} this month`
                : "Based on records created this month"}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-950">Certificates by Status</h3>
          {certificateInsights.certificatesByStatus.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No certificate records yet.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {certificateInsights.certificatesByStatus.map((item) => (
                <StatusBadge key={item.status} tone="info">
                  {formatCertificateStatus(item.status)}: {item.count.toLocaleString()}
                </StatusBadge>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Public Request Insights" description="Online request queues needing attention.">
        <div className="grid gap-3">
          <InsightNumber label="Online requests today" value={publicRequestInsights.onlineRequestsToday} />
          <InsightNumber label="Requests needing action" value={publicRequestInsights.requestsNeedingAction} />
          <InsightNumber label="Ready for pickup/download" value={publicRequestInsights.readyForRelease} />
        </div>
        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Action queue includes {formatPublicRequestStatus("SUBMITTED")}, {formatPublicRequestStatus("UNDER_REVIEW")},{" "}
          {formatPublicRequestStatus("NEEDS_MORE_INFO")}, and {formatPublicRequestStatus("FOR_APPROVAL")}.
        </div>
      </SectionCard>
    </section>
  );
}

function InsightNumber({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value.toLocaleString()}</p>
    </div>
  );
}

function SummaryBars({ items }: { items: { label: string; count: number }[] }) {
  const max = Math.max(...items.map((item) => item.count), 0);

  if (items.length === 0) {
    return <p className="mt-2 text-sm text-slate-500">No active resident purok data yet.</p>;
  }

  return (
    <div className="mt-3 space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-700">{item.label}</span>
            <span className="text-slate-500">{item.count.toLocaleString()}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${max ? Math.max((item.count / max) * 100, 8) : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
