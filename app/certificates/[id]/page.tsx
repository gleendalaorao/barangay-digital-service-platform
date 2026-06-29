import Link from "next/link";
import { CertificateStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CertificateAccessNotice } from "@/components/certificates/access-notice";
import { PrintButton } from "@/components/certificates/print-button";
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
import { buildCertificateDocument, canExportCertificate } from "@/lib/certificates/content";
import { getCertificateAccessMessage, requireCertificateSession } from "@/lib/certificates/access";
import { formatCertificateStatus, formatCertificateType, formatDateTime } from "@/lib/certificates/format";
import { getCertificateForRender } from "@/lib/certificates/query";
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

  const certificate = await getCertificateForRender(id, session.barangayId);

  if (!certificate) {
    notFound();
  }

  const certificateDocument = certificate.resident ? buildCertificateDocument(certificate) : null;
  const exportReady = canExportCertificate(certificate.status);

  return (
    <DashboardShell>
      <CertificateDetailFrame
        title={certificate.controlNumber ?? "Certificate Record"}
        action={<CertificateActions id={certificate.id} status={certificate.status} role={session.role} exportReady={exportReady} />}
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

          <div className="space-y-4">
            {!exportReady ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Export is available after the certificate is approved.
              </div>
            ) : null}
            {certificateDocument ? <CertificatePreview document={certificateDocument} /> : null}
          </div>
        </div>
      </CertificateDetailFrame>
    </DashboardShell>
  );
}

function CertificateActions({
  id,
  status,
  role,
  exportReady,
}: {
  id: string;
  status: CertificateStatus;
  role: Parameters<typeof canApproveCertificates>[0];
  exportReady: boolean;
}) {
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
      {exportReady ? (
        <>
          <PrintButton />
          <a href={`/certificates/${id}/pdf`} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-ink-700">
            Download PDF
          </a>
          <a href={`/certificates/${id}/docx`} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-ink-700">
            Download DOCX
          </a>
        </>
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

function CertificatePreview({ document }: { document: ReturnType<typeof buildCertificateDocument> }) {
  return (
    <section id="certificate-preview" className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
      <div className="text-center">
        <p className="text-sm text-ink-700">Republic of the Philippines</p>
        <p className="text-sm text-ink-700">{document.municipalityLine}</p>
        <p className="mt-1 text-lg font-semibold text-ink-900">Barangay {document.barangayName}</p>
        <p className="text-xs text-ink-500">{document.officeAddress}</p>
      </div>

      <div className="mt-8 text-center">
        <h2 className="text-2xl font-semibold uppercase tracking-wide text-ink-900">{document.title}</h2>
        <p className="mt-3 text-right text-xs text-ink-500">Control No.: {document.controlNumber}</p>
      </div>

      <div className="mt-8 space-y-4 text-sm leading-7 text-ink-900">
        {document.body.map((paragraph) => (
          <p key={paragraph} className="text-justify">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-8 grid gap-2 text-sm text-ink-700">
        <p>
          <span className="font-semibold">Purpose:</span> {document.purpose}
        </p>
        <p>
          <span className="font-semibold">Issued Date:</span> {document.issuedDate}
        </p>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-8 text-center text-sm">
        <div>
          <p className="border-t border-ink-700 pt-2 font-semibold text-ink-900">{document.preparedBy}</p>
          <p className="text-ink-500">Prepared by</p>
        </div>
        <div>
          <p className="border-t border-ink-700 pt-2 font-semibold text-ink-900">{document.approvedBy}</p>
          <p className="text-ink-500">Approved by / Barangay Captain</p>
        </div>
      </div>
    </section>
  );
}
