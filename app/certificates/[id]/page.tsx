import Link from "next/link";
import { CertificateStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CertificateAccessNotice } from "@/components/certificates/access-notice";
import {
  approveCertificate,
  cancelCertificate,
  releaseCertificate,
  submitCertificateForApproval,
} from "../actions";
import {
  canApproveCertificates,
  canCancelCertificates,
  canReleaseCertificates,
  canSubmitCertificatesForApproval,
} from "@/lib/auth/roles";
import { getCertificateAccessMessage, requireCertificateSession } from "@/lib/certificates/access";
import { formatCertificateStatus, formatCertificateType, formatDateTime } from "@/lib/certificates/format";
import { prisma } from "@/lib/prisma";
import { calculateAge, formatResidentName } from "@/lib/residents/format";

type CertificateDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CertificateDetailPage({ params }: CertificateDetailPageProps) {
  const { id } = await params;
  let session: Awaited<ReturnType<typeof requireCertificateSession>>;

  try {
    session = await requireCertificateSession();
  } catch (error) {
    return (
      <DashboardShell>
        <CertificateDetailFrame title="Certificate Record">
          <CertificateAccessNotice message={getCertificateAccessMessage(error)} />
        </CertificateDetailFrame>
      </DashboardShell>
    );
  }

  const certificate = await prisma.certificateRequest.findFirst({
    where: {
      id,
      barangayId: session.barangayId,
    },
    include: {
      resident: true,
      requestedBy: true,
      approvedBy: true,
    },
  });

  if (!certificate) {
    notFound();
  }

  return (
    <DashboardShell>
      <CertificateDetailFrame
        title={certificate.controlNumber ?? "Certificate Record"}
        action={<CertificateActions id={certificate.id} status={certificate.status} role={session.role} />}
      >
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-ink-900">Resident Information</h2>
              {certificate.resident ? (
                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Info label="Full name" value={formatResidentName(certificate.resident)} />
                  <Info label="Gender" value={certificate.resident.gender} />
                  <Info label="Age" value={calculateAge(certificate.resident.birthDate)?.toString()} />
                  <Info label="Contact number" value={certificate.resident.contactNumber} />
                  <Info label="Purok" value={certificate.resident.purok} />
                  <Info label="Address" value={certificate.resident.addressLine} />
                </dl>
              ) : (
                <p className="mt-3 text-sm text-ink-500">Resident record is no longer available.</p>
              )}
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-ink-900">Certificate Information</h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <Info label="Certificate type" value={formatCertificateType(certificate.certificateType)} />
                <Info label="Purpose" value={certificate.purpose} />
                <Info label="Remarks" value={certificate.remarks} />
                <Info label="Status" value={formatCertificateStatus(certificate.status)} />
                <Info label="Prepared by" value={certificate.requestedBy?.name} />
                <Info label="Approved by" value={certificate.approvedBy?.name} />
                <Info label="Created" value={formatDateTime(certificate.createdAt)} />
                <Info label="Issued" value={formatDateTime(certificate.issuedAt)} />
                <Info label="Released" value={formatDateTime(certificate.releasedAt)} />
                <Info label="Updated" value={formatDateTime(certificate.updatedAt)} />
              </dl>
            </section>
          </div>

          <section className="rounded-md border border-dashed border-slate-300 bg-white p-5">
            <h2 className="text-lg font-semibold text-ink-900">Certificate Preview</h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Certificate preview will be implemented in the next milestone.
            </p>
          </section>
        </div>
      </CertificateDetailFrame>
    </DashboardShell>
  );
}

function CertificateActions({ id, status, role }: { id: string; status: CertificateStatus; role: Parameters<typeof canApproveCertificates>[0] }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {status === CertificateStatus.DRAFT && canSubmitCertificatesForApproval(role) ? (
        <ActionButton id={id} action={submitCertificateForApproval} label="Submit" />
      ) : null}
      {status === CertificateStatus.PENDING_APPROVAL && canApproveCertificates(role) ? (
        <ActionButton id={id} action={approveCertificate} label="Approve" />
      ) : null}
      {status === CertificateStatus.APPROVED && canReleaseCertificates(role) ? (
        <ActionButton id={id} action={releaseCertificate} label="Mark Released" />
      ) : null}
      {status !== CertificateStatus.RELEASED && status !== CertificateStatus.CANCELLED && canCancelCertificates(role) ? (
        <ActionButton id={id} action={cancelCertificate} label="Cancel" variant="danger" />
      ) : null}
    </div>
  );
}

function ActionButton({
  id,
  action,
  label,
  variant = "primary",
}: {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  variant?: "primary" | "danger";
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className={
          variant === "danger"
            ? "rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            : "rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
        }
      >
        {label}
      </button>
    </form>
  );
}

function CertificateDetailFrame({
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
          <Link href="/certificates" className="text-sm font-medium text-brand-700">
            Certificate Logbook
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">{title}</h1>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-1 text-sm text-ink-900">{value || "-"}</dd>
    </div>
  );
}
