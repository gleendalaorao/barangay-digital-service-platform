import Link from "next/link";
import { notFound } from "next/navigation";
import { SearchCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCertificateType, formatDateTime } from "@/lib/certificates/format";
import {
  formatPublicRequestStatus,
  getPublicRequestInstruction,
} from "@/lib/public-requests/format";

type TrackPageProps = {
  params: Promise<{ barangaySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TrackRequestPage({ params, searchParams }: TrackPageProps) {
  const { barangaySlug } = await params;
  const rawSearchParams = await searchParams;
  const barangay = await prisma.barangay.findUnique({
    where: { slug: barangaySlug },
    select: { id: true, name: true, slug: true },
  });

  if (!barangay) {
    notFound();
  }

  const requestNumber = toSingle(rawSearchParams.requestNumber) ?? "";
  const contactNumber = toSingle(rawSearchParams.contactNumber) ?? "";
  const submitted = toSingle(rawSearchParams.submitted) === "1";
  const request =
    requestNumber && contactNumber
      ? await prisma.publicDocumentRequest.findFirst({
          where: {
            barangayId: barangay.id,
            trackingCode: requestNumber,
            requesterMobile: contactNumber,
          },
        })
      : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href={`/b/${barangay.slug}`} className="text-sm font-semibold text-ink-900">
            Barangay {barangay.name}
          </Link>
          <Link href={`/b/${barangay.slug}/request`} className="text-sm font-medium text-brand-700">
            Request Document
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <SearchCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">Request Tracking</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Track Document Request</h1>
              {submitted ? (
            <p className="mt-2 text-sm text-emerald-700">
              Your request was submitted. Keep your request number and contact number for tracking.
            </p>
          ) : null}
            </div>
          </div>
        </div>

        <form className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" action={`/b/${barangay.slug}/track`}>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <label className="block">
              <span className="text-sm font-medium text-ink-700">Request number</span>
              <input name="requestNumber" defaultValue={requestNumber} required className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink-700">Contact number</span>
              <input name="contactNumber" defaultValue={contactNumber} required className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm" />
            </label>
            <button type="submit" className="h-11 self-end rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
              Track
            </button>
          </div>
        </form>

        {request ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Request Status</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <Info label="Request number" value={request.trackingCode} />
              <Info label="Certificate type" value={formatCertificateType(request.certificateType)} />
              <Info label="Status" value={formatPublicRequestStatus(request.status)} />
              <Info label="Submitted date" value={formatDateTime(request.submittedAt)} />
              <Info label="Instructions" value={getPublicRequestInstruction(request.status)} wide />
              <Info label="Submitted notes" value={request.notes} wide />
            </dl>
          </section>
        ) : requestNumber || contactNumber ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            No request matched that request number and contact number for this barangay.
          </div>
        ) : null}
      </div>
    </main>
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

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
