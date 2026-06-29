import Link from "next/link";
import { PublicRequestStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RequestAccessNotice } from "@/components/requests/access-notice";
import { updatePublicRequestStatus } from "../actions";
import { canUpdatePublicRequestStatus } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { formatCertificateType, formatDateTime } from "@/lib/certificates/format";
import { getPublicRequestAccessMessage, requirePublicRequestBarangaySession } from "@/lib/public-requests/access";
import {
  formatPublicRequesterName,
  formatPublicRequestStatus,
  getPublicRequestInstruction,
} from "@/lib/public-requests/format";

type RequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

const statusActions = [
  PublicRequestStatus.UNDER_REVIEW,
  PublicRequestStatus.NEEDS_MORE_INFO,
  PublicRequestStatus.FOR_APPROVAL,
  PublicRequestStatus.APPROVED,
  PublicRequestStatus.READY_FOR_PICKUP,
  PublicRequestStatus.READY_FOR_DOWNLOAD,
  PublicRequestStatus.RELEASED,
  PublicRequestStatus.REJECTED,
  PublicRequestStatus.CANCELLED,
];

export default async function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { id } = await params;
  let session: Awaited<ReturnType<typeof requirePublicRequestBarangaySession>>;

  try {
    session = await requirePublicRequestBarangaySession();
  } catch (error) {
    return (
      <DashboardShell>
        <RequestDetailFrame title="Public Request">
          <RequestAccessNotice message={getPublicRequestAccessMessage(error)} />
        </RequestDetailFrame>
      </DashboardShell>
    );
  }

  const request = await prisma.publicDocumentRequest.findFirst({
    where: {
      id,
      barangayId: session.barangayId,
    },
  });

  if (!request) {
    notFound();
  }

  return (
    <DashboardShell>
      <RequestDetailFrame
        title={request.trackingCode}
        action={<RequestActions id={request.id} role={session.role} currentStatus={request.status} />}
      >
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-ink-900">Requester Information</h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <Info label="Name" value={formatPublicRequesterName(request)} />
                <Info label="Birth date" value={request.birthDate?.toLocaleDateString("en-PH")} />
                <Info label="Contact number" value={request.requesterMobile} />
                <Info label="Email" value={request.requesterEmail} />
                <Info label="Address" value={request.addressLine} />
                <Info label="Purok" value={request.purok} />
              </dl>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-ink-900">Requested Document</h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <Info label="Certificate type" value={formatCertificateType(request.certificateType)} />
                <Info label="Purpose" value={request.purpose} />
                <Info label="Status" value={formatPublicRequestStatus(request.status)} />
                <Info label="Submitted" value={formatDateTime(request.submittedAt)} />
                <Info label="Reviewed" value={formatDateTime(request.reviewedAt)} />
                <Info label="Completed" value={formatDateTime(request.completedAt)} />
                <Info label="Notes" value={request.notes} wide />
              </dl>
            </section>
          </div>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink-900">Public Instruction</h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">{getPublicRequestInstruction(request.status)}</p>
            <p className="mt-5 text-xs leading-5 text-ink-500">
              This public request does not issue an official certificate automatically. Staff must still prepare and approve official documents.
            </p>
          </section>
        </div>
      </RequestDetailFrame>
    </DashboardShell>
  );
}

function RequestActions({
  id,
  role,
  currentStatus,
}: {
  id: string;
  role: Parameters<typeof canUpdatePublicRequestStatus>[0];
  currentStatus: PublicRequestStatus;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {statusActions
        .filter((status) => status !== currentStatus && canUpdatePublicRequestStatus(role, status))
        .map((status) => (
          <form key={status} action={updatePublicRequestStatus.bind(null, status)}>
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className={
                status === PublicRequestStatus.REJECTED || status === PublicRequestStatus.CANCELLED
                  ? "rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                  : "rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-ink-700"
              }
            >
              {formatPublicRequestStatus(status)}
            </button>
          </form>
        ))}
    </div>
  );
}

function RequestDetailFrame({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link href="/requests" className="text-sm font-medium text-brand-700">
            Public Requests
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">{title}</h1>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Info({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-1 text-sm text-ink-900">{value || "-"}</dd>
    </div>
  );
}
