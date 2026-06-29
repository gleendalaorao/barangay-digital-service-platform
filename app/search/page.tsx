import Link from "next/link";
import { FileCheck2, Home, Inbox, Search, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCertificateStatus, formatCertificateType, formatDate, formatDateTime } from "@/lib/certificates/format";
import { formatHouseholdAddress } from "@/lib/households/format";
import { getEffectiveSession } from "@/lib/platform/workspace";
import { prisma } from "@/lib/prisma";
import { formatPublicRequesterName, formatPublicRequestStatus } from "@/lib/public-requests/format";
import { formatResidentName } from "@/lib/residents/format";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type SearchResult = {
  id: string;
  type: "Resident" | "Household" | "Certificate" | "Public Request";
  title: string;
  subtitle: string;
  status?: string;
  href: string;
  sortDate?: Date;
};

const resultIcons = {
  Resident: Users,
  Household: Home,
  Certificate: FileCheck2,
  "Public Request": Inbox,
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const rawSearchParams = await searchParams;
  const query = toSingle(rawSearchParams.q)?.trim() ?? "";
  const session = await getEffectiveSession();
  const barangayId = session?.user?.barangayId;

  if (!barangayId) {
    return (
      <DashboardShell>
        <SearchPageFrame query={query}>
          <div className="rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-ink-900">Search needs a barangay workspace.</p>
            <p className="mt-2 text-sm text-ink-500">
              Select a barangay context before searching residents, households, certificates, and public requests.
            </p>
          </div>
        </SearchPageFrame>
      </DashboardShell>
    );
  }

  const results = query ? await searchWorkspace(barangayId, query) : [];

  return (
    <DashboardShell>
      <SearchPageFrame query={query}>
        {!query ? (
          <div className="rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-ink-900">Start with a name, control number, household number, or tracking code.</p>
            <p className="mt-2 text-sm text-ink-500">Global search checks tenant-scoped workspace records only.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-ink-900">No records found.</p>
            <p className="mt-2 text-sm text-ink-500">Try a shorter name, contact number, control number, or request tracking code.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink-600">
              Showing {results.length} result{results.length === 1 ? "" : "s"} for <span className="font-semibold text-ink-900">{query}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {results.map((result) => {
                const Icon = resultIcons[result.type];

                return (
                  <Link key={`${result.type}-${result.id}`} href={result.href} className="flex gap-4 px-4 py-4 transition hover:bg-slate-50">
                    <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{result.type}</span>
                        {result.status ? <StatusBadge tone={getStatusTone(result.status)}>{result.status}</StatusBadge> : null}
                      </span>
                      <span className="mt-1 block truncate text-sm font-semibold text-ink-900">{result.title}</span>
                      <span className="mt-1 block text-sm text-ink-600">{result.subtitle}</span>
                    </span>
                    <span className="hidden self-center text-sm font-medium text-brand-700 sm:block">Open</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </SearchPageFrame>
    </DashboardShell>
  );
}

function SearchPageFrame({ query, children }: { query: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand-700">Workspace Search</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink-900">Global Search</h1>
      </div>
      <form action="/search" className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex h-12 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 focus-within:border-brand-500">
          <Search className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search residents, households, certificates, or public requests"
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink-900 outline-none"
            autoFocus
          />
          <button type="submit" className="h-9 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white">
            Search
          </button>
        </label>
      </form>
      {children}
    </div>
  );
}

async function searchWorkspace(barangayId: string, query: string): Promise<SearchResult[]> {
  const [residents, households, certificates, publicRequests] = await Promise.all([
    prisma.resident.findMany({
      where: {
        barangayId,
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { middleName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { suffix: { contains: query, mode: "insensitive" } },
          { contactNumber: { contains: query, mode: "insensitive" } },
          { addressLine: { contains: query, mode: "insensitive" } },
          { purok: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 8,
    }),
    prisma.household.findMany({
      where: {
        barangayId,
        OR: [
          { householdNo: { contains: query, mode: "insensitive" } },
          { addressLine: { contains: query, mode: "insensitive" } },
          { purok: { contains: query, mode: "insensitive" } },
          {
            headResident: {
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { middleName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
              ],
            },
          },
        ],
      },
      include: {
        headResident: true,
        _count: { select: { residents: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 8,
    }),
    prisma.certificateRequest.findMany({
      where: {
        barangayId,
        OR: [
          { controlNumber: { contains: query, mode: "insensitive" } },
          { purpose: { contains: query, mode: "insensitive" } },
          { remarks: { contains: query, mode: "insensitive" } },
          {
            resident: {
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { middleName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
              ],
            },
          },
        ],
      },
      include: { resident: true },
      orderBy: [{ updatedAt: "desc" }],
      take: 8,
    }),
    prisma.publicDocumentRequest.findMany({
      where: {
        barangayId,
        OR: [
          { trackingCode: { contains: query, mode: "insensitive" } },
          { requesterName: { contains: query, mode: "insensitive" } },
          { requesterEmail: { contains: query, mode: "insensitive" } },
          { requesterMobile: { contains: query, mode: "insensitive" } },
          { firstName: { contains: query, mode: "insensitive" } },
          { middleName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { purpose: { contains: query, mode: "insensitive" } },
          { addressLine: { contains: query, mode: "insensitive" } },
          { purok: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 8,
    }),
  ]);

  return [
    ...residents.map((resident): SearchResult => ({
      id: resident.id,
      type: "Resident",
      title: formatResidentName(resident),
      subtitle: [resident.contactNumber, resident.purok, resident.addressLine].filter(Boolean).join(" | ") || "Resident record",
      status: resident.isActive ? "Active" : "Inactive",
      href: `/residents/${resident.id}`,
      sortDate: resident.updatedAt,
    })),
    ...households.map((household): SearchResult => ({
      id: household.id,
      type: "Household",
      title: `Household ${household.householdNo}`,
      subtitle: [
        household.headResident ? `Head: ${formatResidentName(household.headResident)}` : "No household head",
        `${household._count.residents} member${household._count.residents === 1 ? "" : "s"}`,
        formatHouseholdAddress(household),
      ].join(" | "),
      status: household.isActive ? "Active" : "Inactive",
      href: `/households/${household.id}`,
      sortDate: household.updatedAt,
    })),
    ...certificates.map((certificate): SearchResult => ({
      id: certificate.id,
      type: "Certificate",
      title: certificate.controlNumber ?? formatCertificateType(certificate.certificateType),
      subtitle: [
        formatCertificateType(certificate.certificateType),
        certificate.resident ? formatResidentName(certificate.resident) : "No linked resident",
        certificate.purpose,
        `Issued: ${formatDate(certificate.issuedAt)}`,
      ]
        .filter(Boolean)
        .join(" | "),
      status: formatCertificateStatus(certificate.status),
      href: `/certificates/${certificate.id}`,
      sortDate: certificate.updatedAt,
    })),
    ...publicRequests.map((request): SearchResult => ({
      id: request.id,
      type: "Public Request",
      title: request.trackingCode,
      subtitle: [
        formatPublicRequesterName(request),
        formatCertificateType(request.certificateType),
        request.requesterMobile,
        `Submitted: ${formatDateTime(request.submittedAt)}`,
      ].join(" | "),
      status: formatPublicRequestStatus(request.status),
      href: `/requests/${request.id}`,
      sortDate: request.updatedAt,
    })),
  ]
    .sort((first, second) => (second.sortDate?.getTime() ?? 0) - (first.sortDate?.getTime() ?? 0))
    .slice(0, 30);
}

function getStatusTone(status: string) {
  if (["Active", "Approved", "Released", "Ready For Pickup", "Ready For Download"].includes(status)) {
    return "success";
  }

  if (["Pending Approval", "Submitted", "Under Review", "For Approval", "Needs More Info", "Draft"].includes(status)) {
    return "warning";
  }

  if (["Cancelled", "Rejected", "Inactive"].includes(status)) {
    return "danger";
  }

  return "neutral";
}

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
