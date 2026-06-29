import Link from "next/link";
import { CertificateStatus, CertificateType, Prisma } from "@prisma/client";
import { Plus, Search } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CertificateAccessNotice } from "@/components/certificates/access-notice";
import { prisma } from "@/lib/prisma";
import { getCertificateAccessMessage, requireCertificateSession } from "@/lib/certificates/access";
import { formatCertificateStatus, formatCertificateType, formatDate } from "@/lib/certificates/format";
import { formatResidentName } from "@/lib/residents/format";
import { certificateListFilterSchema } from "@/lib/validation/certificate";

type CertificatesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CertificatesPage({ searchParams }: CertificatesPageProps) {
  const rawSearchParams = await searchParams;
  const filters = certificateListFilterSchema.parse({
    controlNumber: toSingle(rawSearchParams.controlNumber),
    resident: toSingle(rawSearchParams.resident),
    certificateType: toSingle(rawSearchParams.certificateType),
    status: toSingle(rawSearchParams.status),
    dateFrom: toSingle(rawSearchParams.dateFrom),
    dateTo: toSingle(rawSearchParams.dateTo),
  });

  let session: Awaited<ReturnType<typeof requireCertificateSession>>;

  try {
    session = await requireCertificateSession();
  } catch (error) {
    return (
      <DashboardShell>
        <CertificatePageFrame title="Certificate Logbook">
          <CertificateAccessNotice message={getCertificateAccessMessage(error)} />
        </CertificatePageFrame>
      </DashboardShell>
    );
  }

  const issuedAtFilter = buildDateRange(filters.dateFrom, filters.dateTo);
  const where: Prisma.CertificateRequestWhereInput = {
    barangayId: session.barangayId,
    ...(filters.controlNumber
      ? { controlNumber: { contains: filters.controlNumber, mode: "insensitive" } }
      : {}),
    ...(filters.certificateType ? { certificateType: filters.certificateType } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(issuedAtFilter ? { issuedAt: issuedAtFilter } : {}),
    ...(filters.resident
      ? {
          resident: {
            OR: [
              { firstName: { contains: filters.resident, mode: "insensitive" } },
              { middleName: { contains: filters.resident, mode: "insensitive" } },
              { lastName: { contains: filters.resident, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const certificates = await prisma.certificateRequest.findMany({
    where,
    include: {
      resident: true,
      requestedBy: true,
      approvedBy: true,
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });

  return (
    <DashboardShell>
      <CertificatePageFrame
        title="Certificate Logbook"
        action={
          <Link href="/certificates/new" className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Certificate
          </Link>
        }
      >
        <form className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" action="/certificates">
          <div className="grid gap-3 xl:grid-cols-[170px_1fr_180px_170px_150px_150px_auto]">
            <input
              type="search"
              name="controlNumber"
              defaultValue={filters.controlNumber ?? ""}
              placeholder="Control no."
              className="h-11 rounded-md border border-slate-200 px-3 text-sm text-ink-900 outline-none focus:border-brand-500"
            />
            <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
              <Search className="h-4 w-4 text-ink-500" aria-hidden="true" />
              <input
                type="search"
                name="resident"
                defaultValue={filters.resident ?? ""}
                placeholder="Search resident"
                className="w-full border-0 bg-transparent text-sm text-ink-900 outline-none"
              />
            </label>
            <select name="certificateType" defaultValue={filters.certificateType ?? ""} className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option value="">All types</option>
              {Object.values(CertificateType).map((type) => (
                <option key={type} value={type}>
                  {formatCertificateType(type)}
                </option>
              ))}
            </select>
            <select name="status" defaultValue={filters.status ?? ""} className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option value="">All status</option>
              {Object.values(CertificateStatus).map((status) => (
                <option key={status} value={status}>
                  {formatCertificateStatus(status)}
                </option>
              ))}
            </select>
            <input type="date" name="dateFrom" defaultValue={filters.dateFrom ?? ""} className="h-11 rounded-md border border-slate-200 px-3 text-sm" />
            <input type="date" name="dateTo" defaultValue={filters.dateTo ?? ""} className="h-11 rounded-md border border-slate-200 px-3 text-sm" />
            <button type="submit" className="h-11 rounded-md border border-slate-200 px-4 text-sm font-medium text-ink-700">
              Apply
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">Control number</th>
                <th className="px-4 py-3">Resident</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Issued date</th>
                <th className="px-4 py-3">Prepared by</th>
                <th className="px-4 py-3">Approved by</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {certificates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-ink-500">
                    No certificate records found.
                  </td>
                </tr>
              ) : (
                certificates.map((certificate) => (
                  <tr key={certificate.id} className="align-middle">
                    <td className="px-4 py-3 font-medium text-ink-900">{certificate.controlNumber ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-700">
                      {certificate.resident ? formatResidentName(certificate.resident) : "-"}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{formatCertificateType(certificate.certificateType)}</td>
                    <td className="px-4 py-3 text-ink-700">{certificate.purpose ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-700">{formatCertificateStatus(certificate.status)}</td>
                    <td className="px-4 py-3 text-ink-700">{formatDate(certificate.issuedAt)}</td>
                    <td className="px-4 py-3 text-ink-700">{certificate.requestedBy?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-700">{certificate.approvedBy?.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/certificates/${certificate.id}`} className="font-medium text-brand-700">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CertificatePageFrame>
    </DashboardShell>
  );
}

function CertificatePageFrame({
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
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand-700">Certificate Records</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">{title}</h1>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function buildDateRange(dateFrom?: string, dateTo?: string) {
  if (!dateFrom && !dateTo) {
    return undefined;
  }

  return {
    ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00`) } : {}),
    ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59`) } : {}),
  };
}

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
