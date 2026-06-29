import Link from "next/link";
import { redirect } from "next/navigation";
import { ResidentAccountStatus } from "@prisma/client";
import { FileText, LogOut, UserCheck } from "lucide-react";
import { formatBarangayDisplayName } from "@/lib/barangay-display";
import { formatDateTime } from "@/lib/certificates/format";
import { formatResidentAccountName, formatResidentAccountStatus, getResidentStatusTone } from "@/lib/resident-accounts/format";
import { getResidentSession } from "@/lib/resident-accounts/session";
import { StatusBadge } from "@/components/ui/status-badge";
import { logoutResident } from "../actions";

type ResidentDashboardPageProps = {
  params: Promise<{ barangaySlug: string }>;
  searchParams?: Promise<{ signedUp?: string }>;
};

export default async function ResidentDashboardPage({ params, searchParams }: ResidentDashboardPageProps) {
  const { barangaySlug } = await params;
  const flags = await searchParams;
  const account = await getResidentSession(barangaySlug);

  if (!account) {
    redirect(`/b/${barangaySlug}/resident/login`);
  }

  const isVerified = account.status === ResidentAccountStatus.VERIFIED;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href={`/b/${account.barangay.slug}`} className="text-sm font-semibold text-ink-900">
            {formatBarangayDisplayName(account.barangay.name)}
          </Link>
          <form action={logoutResident.bind(null, account.barangay.slug)}>
            <button type="submit" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
        {flags?.signedUp === "1" ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Your resident account was submitted for barangay staff verification.
          </div>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <UserCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">Resident Dashboard</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{formatResidentAccountName(account)}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">{account.addressLine}</p>
              </div>
            </div>
            <StatusBadge tone={getResidentStatusTone(account.status)}>{formatResidentAccountStatus(account.status)}</StatusBadge>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Profile Status</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {isVerified
                ? "Your account is verified. You can request documents with your resident profile prefilled."
                : "Barangay staff must verify your profile before it is treated as an official resident account."}
            </p>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Contact number" value={account.contactNumber} />
              <Info label="Email" value={account.email} />
              <Info label="Purok" value={account.purok ?? "-"} />
              <Info label="Linked resident record" value={account.resident ? formatResidentAccountName(account.resident) : "Not linked yet"} />
            </div>
            <Link
              href={`/b/${account.barangay.slug}/request`}
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Request Document
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Request History</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Document request history for resident accounts will appear here in a later workflow pass.
            </p>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-950">Verification Activity</h3>
              <div className="mt-3 space-y-3">
                {account.verificationRequests.map((request) => (
                  <div key={request.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <StatusBadge tone={getResidentStatusTone(request.status)}>{formatResidentAccountStatus(request.status)}</StatusBadge>
                      <span className="text-xs text-slate-500">{formatDateTime(request.submittedAt)}</span>
                    </div>
                    {request.staffNotes ? <p className="mt-2 text-slate-600">{request.staffNotes}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  );
}
