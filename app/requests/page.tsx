import Link from "next/link";
import { PublicRequestStatus } from "@prisma/client";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RequestAccessNotice } from "@/components/requests/access-notice";
import { prisma } from "@/lib/prisma";
import { formatCertificateType, formatDateTime } from "@/lib/certificates/format";
import { getPublicRequestAccessMessage, requirePublicRequestBarangaySession } from "@/lib/public-requests/access";
import { formatPublicRequesterName, formatPublicRequestStatus } from "@/lib/public-requests/format";

type RequestsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const rawSearchParams = await searchParams;
  const status = toSingle(rawSearchParams.status) as PublicRequestStatus | undefined;
  let session: Awaited<ReturnType<typeof requirePublicRequestBarangaySession>>;

  try {
    session = await requirePublicRequestBarangaySession();
  } catch (error) {
    return (
      <DashboardShell>
        <RequestPageFrame title="Public Requests">
          <RequestAccessNotice message={getPublicRequestAccessMessage(error)} />
        </RequestPageFrame>
      </DashboardShell>
    );
  }

  const requests = await prisma.publicDocumentRequest.findMany({
    where: {
      barangayId: session.barangayId,
      ...(status && Object.values(PublicRequestStatus).includes(status) ? { status } : {}),
    },
    orderBy: { submittedAt: "desc" },
    take: 100,
  });

  return (
    <DashboardShell>
      <RequestPageFrame title="Public Requests">
        <form className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" action="/requests">
          <div className="flex flex-col gap-3 sm:flex-row">
            <select name="status" defaultValue={status ?? ""} className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option value="">All status</option>
              {Object.values(PublicRequestStatus).map((item) => (
                <option key={item} value={item}>
                  {formatPublicRequestStatus(item)}
                </option>
              ))}
            </select>
            <button type="submit" className="h-11 rounded-md border border-slate-200 px-4 text-sm font-medium text-ink-700">
              Apply
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">Request number</th>
                <th className="px-4 py-3">Requester</th>
                <th className="px-4 py-3">Certificate type</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Purok</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-ink-500">
                    No public requests found.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 font-medium text-ink-900">{request.trackingCode}</td>
                    <td className="px-4 py-3 text-ink-700">{formatPublicRequesterName(request)}</td>
                    <td className="px-4 py-3 text-ink-700">{formatCertificateType(request.certificateType)}</td>
                    <td className="px-4 py-3 text-ink-700">{request.requesterMobile}</td>
                    <td className="px-4 py-3 text-ink-700">{request.purok ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-700">{formatPublicRequestStatus(request.status)}</td>
                    <td className="px-4 py-3 text-ink-700">{formatDateTime(request.submittedAt)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/requests/${request.id}`} className="font-medium text-brand-700">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </RequestPageFrame>
    </DashboardShell>
  );
}

function RequestPageFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand-700">Citizen Services</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink-900">{title}</h1>
      </div>
      {children}
    </div>
  );
}

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
