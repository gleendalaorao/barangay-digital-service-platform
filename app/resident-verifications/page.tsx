import Link from "next/link";
import { ResidentAccountStatus } from "@prisma/client";
import { UserCheck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/certificates/format";
import { prisma } from "@/lib/prisma";
import {
  canReviewResidentVerifications,
  getResidentVerificationAccessMessage,
  requireResidentVerificationSession,
} from "@/lib/resident-accounts/access";
import { formatResidentAccountName, formatResidentAccountStatus, getResidentStatusTone } from "@/lib/resident-accounts/format";

export default async function ResidentVerificationsPage() {
  let session: Awaited<ReturnType<typeof requireResidentVerificationSession>>;

  try {
    session = await requireResidentVerificationSession();
  } catch (error) {
    return (
      <DashboardShell>
        <Frame>
          <AccessNotice message={getResidentVerificationAccessMessage(error)} />
        </Frame>
      </DashboardShell>
    );
  }

  if (!canReviewResidentVerifications(session.role)) {
    return (
      <DashboardShell>
        <Frame>
          <AccessNotice message="You do not have permission to review resident verifications." />
        </Frame>
      </DashboardShell>
    );
  }

  const requests = await prisma.residentVerificationRequest.findMany({
    where: { barangayId: session.barangayId },
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
    take: 100,
    include: {
      account: true,
      resident: {
        select: {
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true,
        },
      },
    },
  });

  return (
    <DashboardShell>
      <Frame>
        <DataTable>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th>Resident account</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Purok</th>
                <th>Submitted</th>
                <th>Linked resident</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState title="No resident verifications yet" description="Online resident signups will appear here for staff review." icon={UserCheck} />
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <p className="font-semibold text-slate-950">{formatResidentAccountName(request.account)}</p>
                      <p className="text-xs text-slate-500">{request.account.addressLine}</p>
                    </td>
                    <td>
                      <p className="text-slate-700">{request.account.contactNumber}</p>
                      <p className="text-xs text-slate-500">{request.account.email}</p>
                    </td>
                    <td>
                      <StatusBadge tone={getResidentStatusTone(request.status)}>{formatResidentAccountStatus(request.status)}</StatusBadge>
                    </td>
                    <td className="text-slate-700">{request.account.purok ?? "-"}</td>
                    <td className="whitespace-nowrap text-slate-700">{formatDateTime(request.submittedAt)}</td>
                    <td className="text-slate-700">
                      {request.status === ResidentAccountStatus.VERIFIED && request.resident ? formatResidentAccountName(request.resident) : "-"}
                    </td>
                    <td>
                      <Link href={`/resident-verifications/${request.id}`} className="font-medium text-emerald-700">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTable>
      </Frame>
    </DashboardShell>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Citizen Management"
        title="Resident Verifications"
        description="Review online resident account signups before they become verified resident profiles."
      />
      {children}
    </div>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
