import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { canViewBarangayUsers, getUserManagementAccessMessage, requireUserManagementSession } from "@/lib/users/access";
import { formatRole } from "@/lib/users/format";
import { formatDate } from "@/lib/certificates/format";

export default async function UsersPage() {
  let session: Awaited<ReturnType<typeof requireUserManagementSession>>;

  try {
    session = await requireUserManagementSession();
  } catch (error) {
    return (
      <DashboardShell>
        <UsersFrame>
          <AccessNotice message={getUserManagementAccessMessage(error)} />
        </UsersFrame>
      </DashboardShell>
    );
  }

  if (!canViewBarangayUsers(session.role)) {
    return (
      <DashboardShell>
        <UsersFrame>
          <AccessNotice message="Only barangay admins can view and manage user accounts." />
        </UsersFrame>
      </DashboardShell>
    );
  }

  const users = await prisma.user.findMany({
    where: {
      barangayId: session.barangayId,
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return (
    <DashboardShell>
      <UsersFrame
        action={
          <Link href="/users/new" className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New User
          </Link>
        }
      >
        <DataTable>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState title="No users yet" description="Create the first barangay user account." icon={Users} />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium text-slate-950">{user.name}</td>
                    <td className="text-slate-700">{user.email}</td>
                    <td className="text-slate-700">{formatRole(user.role)}</td>
                    <td>
                      <StatusBadge tone={user.isActive ? "success" : "neutral"}>{user.isActive ? "Active" : "Inactive"}</StatusBadge>
                    </td>
                    <td className="text-slate-700">{formatDate(user.createdAt)}</td>
                    <td>
                      <Link href={`/users/${user.id}/edit`} className="font-medium text-emerald-700">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTable>
      </UsersFrame>
    </DashboardShell>
  );
}

function UsersFrame({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="System"
        title="User Management"
        description="Create and manage barangay staff accounts for this tenant."
        action={action}
      />
      {children}
    </div>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
