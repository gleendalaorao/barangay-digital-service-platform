import { CertificateStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCertificateStatus, formatCertificateType, formatDate, formatDateTime } from "@/lib/certificates/format";
import { formatResidentName } from "@/lib/residents/format";
import { checkRateLimit, formatRateLimitMessage, getRequestIp, RATE_LIMITS } from "@/lib/rate-limit";

type VerifyPageProps = {
  params: Promise<{ certificateId: string }>;
};

export default async function VerifyCertificatePage({ params }: VerifyPageProps) {
  const { certificateId } = await params;
  const rateLimit = await checkRateLimit({
    ...RATE_LIMITS.certificateVerification,
    identifier: getRequestIp(await headers()),
  });

  if (!rateLimit.allowed) {
    return (
      <VerifyShell>
        <ResultCard tone="neutral" title="Too many verification attempts." description={formatRateLimitMessage(rateLimit.retryAfterSeconds)} />
      </VerifyShell>
    );
  }

  const certificate = await prisma.certificateRequest.findUnique({
    where: { id: certificateId },
    include: {
      barangay: true,
      resident: {
        select: {
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true,
        },
      },
      requestedBy: {
        select: {
          name: true,
        },
      },
      approvedBy: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!certificate) {
    return (
      <VerifyShell>
        <ResultCard tone="neutral" title="Certificate not found." />
      </VerifyShell>
    );
  }

  if (certificate.status === CertificateStatus.CANCELLED) {
    return (
      <VerifyShell>
        <ResultCard tone="invalid" title="INVALID" description="Certificate has been cancelled." />
      </VerifyShell>
    );
  }

  if (certificate.status !== CertificateStatus.APPROVED && certificate.status !== CertificateStatus.RELEASED) {
    return (
      <VerifyShell>
        <ResultCard tone="invalid" title="INVALID" description="Certificate is not approved for public verification." />
      </VerifyShell>
    );
  }

  if (!certificate.barangay || !certificate.resident) {
    notFound();
  }

  return (
    <VerifyShell>
      <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">VERIFIED</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Authentic Barangay Certificate</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
            This page confirms that the certificate details below match a barangay-issued record.
          </p>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <Info label="Barangay Name" value={certificate.barangay.name} />
          <Info label="Certificate Number" value={certificate.controlNumber} />
          <Info label="Certificate Type" value={formatCertificateType(certificate.certificateType)} />
          <Info label="Resident Name" value={formatResidentName(certificate.resident)} />
          <Info label="Issued Date" value={formatDate(certificate.issuedAt)} />
          <Info label="Status" value={formatCertificateStatus(certificate.status)} />
          <Info label="Prepared By" value={certificate.requestedBy?.name} />
          <Info label="Approved By" value={certificate.approvedBy?.name ?? "Barangay Captain"} />
          <Info label="Verification Timestamp" value={formatDateTime(new Date())} wide />
        </dl>
      </section>
    </VerifyShell>
  );
}

function VerifyShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-center gap-3 text-slate-700">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Barangay Certificate Verification</p>
            <p className="text-xs text-slate-500">Public authenticity check</p>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

function ResultCard({
  tone,
  title,
  description,
}: {
  tone: "neutral" | "invalid";
  title: string;
  description?: string;
}) {
  const invalid = tone === "invalid";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div
        className={
          invalid
            ? "mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-700 ring-1 ring-red-200"
            : "mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-500 ring-1 ring-slate-200"
        }
      >
        {invalid ? <XCircle className="h-9 w-9" aria-hidden="true" /> : <ShieldCheck className="h-9 w-9" aria-hidden="true" />}
      </div>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
      {description ? <p className="mt-3 text-sm text-slate-500">{description}</p> : null}
    </section>
  );
}

function Info({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={wide ? "rounded-lg border border-slate-200 bg-slate-50 p-4 sm:col-span-2" : "rounded-lg border border-slate-200 bg-slate-50 p-4"}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-950">{value || "-"}</dd>
    </div>
  );
}
