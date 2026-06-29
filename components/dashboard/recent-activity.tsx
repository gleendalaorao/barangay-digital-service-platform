import Link from "next/link";
import type { LatestCertificate, LatestPublicRequest } from "@/lib/dashboard/data";
import { formatCertificateStatus, formatCertificateType, formatDateTime } from "@/lib/certificates/format";
import { formatPublicRequestStatus } from "@/lib/public-requests/format";
import { formatResidentName } from "@/lib/residents/format";
import { StatusBadge } from "@/components/ui/status-badge";

export function RecentActivity({
  certificates,
  publicRequests,
}: {
  certificates: LatestCertificate[];
  publicRequests: LatestPublicRequest[];
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <ActivityPanel title="Latest Certificate Requests">
        {certificates.length === 0 ? (
          <EmptyState text="No certificate requests yet." />
        ) : (
          <div className="divide-y divide-slate-100">
            {certificates.map((certificate) => (
              <Link key={certificate.id} href={`/certificates/${certificate.id}`} className="block px-5 py-4 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-ink-900">{certificate.controlNumber ?? "No control number"}</p>
                    <p className="mt-1 text-sm text-ink-500">
                      {certificate.resident ? formatResidentName(certificate.resident) : "No resident"} ·{" "}
                      {formatCertificateType(certificate.certificateType)}
                    </p>
                  </div>
                  <StatusBadge tone="info">
                    {formatCertificateStatus(certificate.status)}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-xs text-ink-500">{formatDateTime(certificate.createdAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </ActivityPanel>

      <ActivityPanel title="Latest Public Online Requests">
        {publicRequests.length === 0 ? (
          <EmptyState text="No public online requests yet." />
        ) : (
          <div className="divide-y divide-slate-100">
            {publicRequests.map((request) => (
              <Link key={request.id} href={`/requests/${request.id}`} className="block px-5 py-4 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-ink-900">{request.trackingCode}</p>
                    <p className="mt-1 text-sm text-ink-500">
                      {request.requesterName} · {formatCertificateType(request.certificateType)}
                    </p>
                  </div>
                  <StatusBadge tone="warning">
                    {formatPublicRequestStatus(request.status)}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-xs text-ink-500">{formatDateTime(request.submittedAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </ActivityPanel>
    </section>
  );
}

function ActivityPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="px-5 py-8 text-sm text-ink-500">{text}</p>;
}
