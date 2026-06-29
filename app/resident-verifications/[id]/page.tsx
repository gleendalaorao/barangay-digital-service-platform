import Link from "next/link";
import { notFound } from "next/navigation";
import { ResidentAccountStatus } from "@prisma/client";
import { ArrowLeft, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime } from "@/lib/certificates/format";
import { prisma } from "@/lib/prisma";
import {
  canReviewResidentVerifications,
  getResidentVerificationAccessMessage,
  requireResidentVerificationSession,
} from "@/lib/resident-accounts/access";
import { formatResidentAccountName, formatResidentAccountStatus, getResidentStatusTone } from "@/lib/resident-accounts/format";
import { approveResidentVerification, markResidentVerificationNeedsInfo, rejectResidentVerification } from "../actions";

type ResidentVerificationDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ approved?: string; updated?: string }>;
};

export default async function ResidentVerificationDetailPage({ params, searchParams }: ResidentVerificationDetailPageProps) {
  const { id } = await params;
  const flags = await searchParams;
  let session: Awaited<ReturnType<typeof requireResidentVerificationSession>>;

  try {
    session = await requireResidentVerificationSession();
  } catch (error) {
    return (
      <DashboardShell>
        <Frame title="Resident Verification">
          <AccessNotice message={getResidentVerificationAccessMessage(error)} />
        </Frame>
      </DashboardShell>
    );
  }

  if (!canReviewResidentVerifications(session.role)) {
    return (
      <DashboardShell>
        <Frame title="Resident Verification">
          <AccessNotice message="You do not have permission to review resident verifications." />
        </Frame>
      </DashboardShell>
    );
  }

  const request = await prisma.residentVerificationRequest.findFirst({
    where: {
      id,
      barangayId: session.barangayId,
    },
    include: {
      account: true,
      resident: true,
      reviewedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!request) {
    notFound();
  }

  const possibleMatch = request.account.birthDate
    ? await prisma.resident.findFirst({
        where: {
          barangayId: session.barangayId,
          firstName: { equals: request.account.firstName, mode: "insensitive" },
          lastName: { equals: request.account.lastName, mode: "insensitive" },
          birthDate: request.account.birthDate,
        },
      })
    : null;

  const canAct = request.status !== ResidentAccountStatus.VERIFIED;

  return (
    <DashboardShell>
      <Frame title={formatResidentAccountName(request.account)}>
        {flags?.approved === "1" ? <Notice message="Resident verification was approved." /> : null}
        {flags?.updated === "1" ? <Notice message="Resident verification status was updated." /> : null}

        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Submitted Profile</h2>
                  <p className="mt-1 text-sm text-slate-500">Review the resident-submitted account information.</p>
                </div>
                <StatusBadge tone={getResidentStatusTone(request.status)}>{formatResidentAccountStatus(request.status)}</StatusBadge>
              </div>
              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Full name" value={formatResidentAccountName(request.account)} />
                <Info label="Birth date" value={formatDate(request.account.birthDate)} />
                <Info label="Gender" value={request.account.gender ?? "-"} />
                <Info label="Contact number" value={request.account.contactNumber} />
                <Info label="Email" value={request.account.email} />
                <Info label="Purok" value={request.account.purok ?? "-"} />
                <Info label="Address" value={request.account.addressLine} wide />
                <Info label="Purpose / reason" value={request.purpose ?? "-"} wide />
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Matching Result</h2>
              <p className="mt-1 text-sm text-slate-500">Approval links to an existing matching resident, or creates a new official resident record.</p>
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
                {request.resident ? (
                  <p className="text-slate-700">Linked resident: {formatResidentAccountName(request.resident)}</p>
                ) : possibleMatch ? (
                  <p className="text-slate-700">Possible existing resident match: {formatResidentAccountName(possibleMatch)}</p>
                ) : (
                  <p className="text-slate-700">No exact existing resident match found. Approval will create a resident record.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Review</h2>
              <p className="mt-1 text-sm text-slate-500">Staff review does not expose password hashes and remains tenant-scoped.</p>
              <form action={approveResidentVerification} className="mt-5 space-y-4">
                <input type="hidden" name="id" value={request.id} />
                <NotesField defaultValue={request.staffNotes ?? ""} />
                <button
                  type="submit"
                  disabled={!canAct}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Approve Verification
                </button>
              </form>
              <div className="mt-3 grid gap-3">
                <form action={markResidentVerificationNeedsInfo}>
                  <input type="hidden" name="id" value={request.id} />
                  <input type="hidden" name="staffNotes" value={request.staffNotes ?? "Please provide more information to the barangay office."} />
                  <button
                    type="submit"
                    disabled={!canAct}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <HelpCircle className="h-4 w-4" aria-hidden="true" />
                    Needs More Info
                  </button>
                </form>
                <form action={rejectResidentVerification}>
                  <input type="hidden" name="id" value={request.id} />
                  <input type="hidden" name="staffNotes" value={request.staffNotes ?? "Verification request rejected after staff review."} />
                  <button
                    type="submit"
                    disabled={!canAct}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    Reject
                  </button>
                </form>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Review History</h2>
              <div className="mt-4 space-y-3 text-slate-600">
                <p>Submitted: {formatDateTime(request.submittedAt)}</p>
                <p>Reviewed: {formatDateTime(request.reviewedAt)}</p>
                <p>Reviewed by: {request.reviewedBy?.name ?? "-"}</p>
                <p>Notes: {request.staffNotes ?? "-"}</p>
              </div>
            </section>
          </aside>
        </section>
      </Frame>
    </DashboardShell>
  );
}

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <Link href="/resident-verifications" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to resident verifications
      </Link>
      <PageHeader
        eyebrow="Citizen Management"
        title={title}
        description="Verify whether this online resident account should become an official resident profile."
      />
      {children}
    </div>
  );
}

function Info({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "rounded-md border border-slate-200 bg-slate-50 p-3 sm:col-span-2" : "rounded-md border border-slate-200 bg-slate-50 p-3"}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  );
}

function NotesField({ defaultValue }: { defaultValue: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">Staff notes</span>
      <textarea name="staffNotes" rows={4} defaultValue={defaultValue} className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
    </label>
  );
}

function Notice({ message }: { message: string }) {
  return <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>;
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
