import Link from "next/link";
import {
  Activity,
  BriefcaseBusiness,
  Calendar,
  Edit,
  FileCheck2,
  FileText,
  Home,
  Inbox,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PrintButton } from "@/components/certificates/print-button";
import { ResidentAccessNotice } from "@/components/residents/access-notice";
import { StatusBadge } from "@/components/ui/status-badge";
import { softDeleteResident } from "../actions";
import { prisma } from "@/lib/prisma";
import { formatCertificateStatus, formatCertificateType, formatDate, formatDateTime } from "@/lib/certificates/format";
import { getResidentAccessMessage, requireResidentBarangayId } from "@/lib/residents/access";
import { calculateAge, formatResidentName } from "@/lib/residents/format";
import { formatPublicRequestStatus } from "@/lib/public-requests/format";
import { getAuditDescription } from "@/lib/audit";

type ResidentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResidentDetailPage({ params }: ResidentDetailPageProps) {
  const { id } = await params;
  let barangayId: string;

  try {
    barangayId = await requireResidentBarangayId();
  } catch (error) {
    return (
      <DashboardShell>
        <ResidentDetailFrame title="Resident Workspace">
          <ResidentAccessNotice message={getResidentAccessMessage(error)} />
        </ResidentDetailFrame>
      </DashboardShell>
    );
  }

  const [resident, auditLogs] = await Promise.all([
    prisma.resident.findFirst({
      where: {
        id,
        barangayId,
      },
      include: {
        household: {
          include: {
            headResident: true,
            residents: {
              orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
            },
          },
        },
        headedHouseholds: true,
        certificateRequests: {
          orderBy: { createdAt: "desc" },
          include: {
            requestedBy: { select: { name: true } },
            approvedBy: { select: { name: true } },
          },
        },
        publicRequests: {
          orderBy: { submittedAt: "desc" },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        barangayId,
        entity: "Resident",
        entityId: id,
      },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  if (!resident) {
    notFound();
  }

  const fullName = formatResidentName(resident);
  const completeAddress = [resident.addressLine, resident.addressBarangay, resident.city, resident.province].filter(Boolean).join(", ");
  const household = resident.household;
  const isHouseholdHead = Boolean(household?.headResidentId && household.headResidentId === resident.id);
  const lastActivity = getLastActivityDate(resident);
  const timeline = buildTimeline(resident, auditLogs);

  return (
    <DashboardShell>
      <ResidentDetailFrame
        title={fullName}
        action={
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <Link href={`/residents/${resident.id}/edit`} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm hover:bg-slate-50">
              <Edit className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
            {resident.isActive ? (
              <form action={softDeleteResident}>
                <input type="hidden" name="id" value={resident.id} />
                <button type="submit" className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700">
                  Deactivate
                </button>
              </form>
            ) : null}
          </div>
        }
      >
        <div id="resident-profile-print" className="space-y-6">
          <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <PersonalInformation
              resident={resident}
              fullName={fullName}
              completeAddress={completeAddress}
            />
            <div className="space-y-5">
              <SummaryCard
                residentStatus={resident.isActive ? "Active" : "Inactive"}
                householdNumber={household?.householdNo}
                certificatesCount={resident.certificateRequests.length}
                requestsCount={resident.publicRequests.length}
                lastActivity={lastActivity}
              />
              <QuickActions residentId={resident.id} householdId={household?.id ?? null} />
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <HouseholdSection
                household={household}
                residentId={resident.id}
                isHouseholdHead={isHouseholdHead}
              />
              <CertificateHistory certificates={resident.certificateRequests} />
              <PublicRequestHistory requests={resident.publicRequests} />
            </div>
            <div className="space-y-5">
              <Timeline items={timeline} />
              <AuditHistory logs={auditLogs} />
            </div>
          </section>
        </div>
      </ResidentDetailFrame>
    </DashboardShell>
  );
}

function PersonalInformation({
  resident,
  fullName,
  completeAddress,
}: {
  resident: NonNullable<Awaited<ReturnType<typeof prisma.resident.findFirst>>>;
  fullName: string;
  completeAddress: string;
}) {
  const residentNumber = `RES-${resident.id.slice(-6).toUpperCase()}`;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
          <User className="h-10 w-10" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand-700">Personal Information</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink-900">{fullName}</h2>
              <p className="mt-1 font-mono text-xs text-ink-500">{residentNumber}</p>
            </div>
            <StatusBadge tone={resident.isActive ? "success" : "neutral"}>{resident.isActive ? "Active" : "Inactive"}</StatusBadge>
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Info icon={Calendar} label="Age" value={calculateAge(resident.birthDate)?.toString()} />
            <Info icon={Calendar} label="Birth Date" value={formatDate(resident.birthDate)} />
            <Info icon={User} label="Gender" value={resident.gender} />
            <Info icon={ShieldCheck} label="Civil Status" value={resident.civilStatus} />
            <Info icon={BriefcaseBusiness} label="Occupation" value={resident.occupation} />
            <Info icon={ShieldCheck} label="Citizenship" value={resident.citizenship} />
            <Info icon={Phone} label="Contact Number" value={resident.contactNumber} />
            <Info icon={MapPin} label="Complete Address" value={completeAddress} wide />
          </dl>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  residentStatus,
  householdNumber,
  certificatesCount,
  requestsCount,
  lastActivity,
}: {
  residentStatus: string;
  householdNumber?: string | null;
  certificatesCount: number;
  requestsCount: number;
  lastActivity: Date;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink-900">Summary</h2>
      <dl className="mt-5 grid gap-4">
        <Info icon={Activity} label="Resident Status" value={residentStatus} />
        <Info icon={Home} label="Household" value={householdNumber ? `Household ${householdNumber}` : "Not assigned"} />
        <Info icon={FileCheck2} label="Certificates Count" value={certificatesCount.toString()} />
        <Info icon={Inbox} label="Requests Count" value={requestsCount.toString()} />
        <Info icon={Calendar} label="Last Activity" value={formatDateTime(lastActivity)} />
      </dl>
    </section>
  );
}

function QuickActions({ residentId, householdId }: { residentId: string; householdId?: string | null }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm print:hidden">
      <h2 className="text-lg font-semibold text-ink-900">Quick Actions</h2>
      <div className="mt-4 grid gap-3">
        <ActionLink href={`/certificates/new?residentId=${residentId}`} icon={FileText} label="Generate Certificate" />
        <ActionLink href={`/residents/${residentId}/edit`} icon={Edit} label="Edit Resident" />
        {householdId ? <ActionLink href={`/households/${householdId}`} icon={Home} label="Open Household" /> : null}
        <PrintButton label="Print Resident Profile" />
        <ActionLink href={`/requests?residentId=${residentId}`} icon={Inbox} label="View Requests" />
      </div>
    </section>
  );
}

function HouseholdSection({
  household,
  residentId,
  isHouseholdHead,
}: {
  household: {
    id: string;
    householdNo: string;
    headResidentId: string | null;
    headResident: { firstName: string; middleName: string | null; lastName: string; suffix: string | null } | null;
    residents: Array<{
      id: string;
      firstName: string;
      middleName: string | null;
      lastName: string;
      suffix: string | null;
      gender: string | null;
      birthDate: Date | null;
      contactNumber: string | null;
    }>;
  } | null;
  residentId: string;
  isHouseholdHead: boolean;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Household</h2>
          <p className="mt-1 text-sm text-ink-500">Household assignment and members.</p>
        </div>
        {household ? (
          <Link href={`/households/${household.id}`} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-ink-700 print:hidden">
            <Home className="h-4 w-4" aria-hidden="true" />
            Open Household
          </Link>
        ) : null}
      </div>

      {!household ? (
        <p className="mt-5 rounded-md border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-ink-500">
          This resident is not assigned to a household.
        </p>
      ) : (
        <>
          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <Info icon={Home} label="Household Number" value={household.householdNo} />
            <Info icon={Users} label="Household Head" value={household.headResident ? formatResidentName(household.headResident) : null} />
            <Info icon={User} label="Relationship" value={isHouseholdHead ? "Household Head" : "Member"} />
          </dl>
          <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {household.residents.map((member) => (
                  <tr key={member.id} className={member.id === residentId ? "bg-emerald-50/60" : undefined}>
                    <td className="font-medium text-ink-900">{formatResidentName(member)}</td>
                    <td className="text-ink-700">{member.gender ?? "-"}</td>
                    <td className="text-ink-700">{calculateAge(member.birthDate) ?? "-"}</td>
                    <td className="text-ink-700">{member.contactNumber ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function CertificateHistory({
  certificates,
}: {
  certificates: Array<{
    id: string;
    controlNumber: string | null;
    certificateType: import("@prisma/client").CertificateType;
    purpose: string | null;
    status: import("@prisma/client").CertificateStatus;
    issuedAt: Date | null;
  }>;
}) {
  return (
    <HistorySection title="Certificate History" empty="No certificate records for this resident.">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr>
            <th>Certificate No.</th>
            <th>Type</th>
            <th>Purpose</th>
            <th>Status</th>
            <th>Issued Date</th>
            <th>Open</th>
          </tr>
        </thead>
        <tbody>
          {certificates.length === 0 ? (
            <EmptyRow colSpan={6} text="No certificate records for this resident." />
          ) : (
            certificates.map((certificate) => (
              <tr key={certificate.id}>
                <td className="font-medium text-ink-900">{certificate.controlNumber ?? "-"}</td>
                <td className="text-ink-700">{formatCertificateType(certificate.certificateType)}</td>
                <td className="text-ink-700">{certificate.purpose ?? "-"}</td>
                <td className="text-ink-700">{formatCertificateStatus(certificate.status)}</td>
                <td className="text-ink-700">{formatDate(certificate.issuedAt)}</td>
                <td>
                  <Link href={`/certificates/${certificate.id}`} className="font-medium text-brand-700 print:hidden">
                    Open
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </HistorySection>
  );
}

function PublicRequestHistory({
  requests,
}: {
  requests: Array<{
    id: string;
    trackingCode: string;
    certificateType: import("@prisma/client").CertificateType;
    status: import("@prisma/client").PublicRequestStatus;
    createdAt: Date;
  }>;
}) {
  return (
    <HistorySection title="Public Request History" empty="No public requests for this resident.">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr>
            <th>Request Number</th>
            <th>Type</th>
            <th>Status</th>
            <th>Created</th>
            <th>Open</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <EmptyRow colSpan={5} text="No public requests for this resident." />
          ) : (
            requests.map((request) => (
              <tr key={request.id}>
                <td className="font-medium text-ink-900">{request.trackingCode}</td>
                <td className="text-ink-700">{formatCertificateType(request.certificateType)}</td>
                <td className="text-ink-700">{formatPublicRequestStatus(request.status)}</td>
                <td className="text-ink-700">{formatDateTime(request.createdAt)}</td>
                <td>
                  <Link href={`/requests/${request.id}`} className="font-medium text-brand-700 print:hidden">
                    Open
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </HistorySection>
  );
}

function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink-900">Timeline</h2>
      <div className="mt-5 space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-ink-500">No timeline activity yet.</p>
        ) : (
          items.map((item, index) => (
            <div key={`${item.label}-${item.date.toISOString()}-${index}`} className="flex gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-600" />
              <div>
                <p className="text-sm font-medium text-ink-900">{item.label}</p>
                <p className="text-xs text-ink-500">{formatDateTime(item.date)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function AuditHistory({
  logs,
}: {
  logs: Array<{
    id: string;
    action: string;
    createdAt: Date;
    metadata: unknown;
    user: { name: string; email: string } | null;
  }>;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink-900">Audit History</h2>
      <div className="mt-5 space-y-4">
        {logs.length === 0 ? (
          <p className="text-sm text-ink-500">No resident-specific audit entries yet.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="rounded-md border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-ink-900">{formatAction(log.action)}</p>
                <p className="whitespace-nowrap text-xs text-ink-500">{formatDateTime(log.createdAt)}</p>
              </div>
              <p className="mt-1 text-sm text-ink-500">{getAuditDescription(log.metadata)}</p>
              <p className="mt-2 text-xs text-ink-500">{log.user ? `${log.user.name} (${log.user.email})` : "System"}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function HistorySection({ title, children }: { title: string; empty: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function ResidentDetailFrame({
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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
        <div>
          <Link href="/residents" className="text-sm font-medium text-brand-700">
            Resident Registry
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">{title}</h1>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Info({ icon: Icon, label, value, wide }: { icon: typeof User; label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2 xl:col-span-3" : ""}>
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-sm text-ink-900">{value || "-"}</dd>
    </div>
  );
}

function ActionLink({ href, icon: Icon, label }: { href: string; icon: typeof User; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-3 text-sm font-medium text-ink-700 shadow-sm hover:bg-slate-50">
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-8 text-center text-ink-500">
        {text}
      </td>
    </tr>
  );
}

type TimelineItem = {
  label: string;
  date: Date;
};

function buildTimeline(
  resident: {
    createdAt: Date;
    updatedAt: Date;
    householdId: string | null;
    certificateRequests: Array<{
      controlNumber: string | null;
      certificateType: import("@prisma/client").CertificateType;
      status: import("@prisma/client").CertificateStatus;
      createdAt: Date;
      releasedAt: Date | null;
    }>;
    publicRequests: Array<{
      trackingCode: string;
      status: import("@prisma/client").PublicRequestStatus;
      submittedAt: Date;
      completedAt: Date | null;
    }>;
  },
  auditLogs: Array<{ action: string; createdAt: Date }>,
) {
  const items: TimelineItem[] = [
    { label: "Resident Created", date: resident.createdAt },
  ];

  if (resident.householdId) {
    items.push({ label: "Household Assigned", date: resident.updatedAt });
  }

  for (const certificate of resident.certificateRequests) {
    items.push({
      label: `Certificate Generated - ${certificate.controlNumber ?? formatCertificateType(certificate.certificateType)}`,
      date: certificate.createdAt,
    });

    if (certificate.releasedAt) {
      items.push({
        label: `Certificate Released - ${certificate.controlNumber ?? formatCertificateStatus(certificate.status)}`,
        date: certificate.releasedAt,
      });
    }
  }

  for (const request of resident.publicRequests) {
    items.push({
      label: `Public Request Submitted - ${request.trackingCode}`,
      date: request.submittedAt,
    });

    if (request.completedAt) {
      items.push({
        label: `Public Request Released - ${request.trackingCode}`,
        date: request.completedAt,
      });
    }
  }

  for (const log of auditLogs) {
    items.push({
      label: formatAction(log.action),
      date: log.createdAt,
    });
  }

  return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 25);
}

function getLastActivityDate(resident: {
  updatedAt: Date;
  certificateRequests: Array<{ updatedAt: Date }>;
  publicRequests: Array<{ updatedAt: Date }>;
}) {
  return [resident.updatedAt, ...resident.certificateRequests.map((item) => item.updatedAt), ...resident.publicRequests.map((item) => item.updatedAt)].sort(
    (a, b) => b.getTime() - a.getTime(),
  )[0];
}

function formatAction(action: string) {
  return action
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
