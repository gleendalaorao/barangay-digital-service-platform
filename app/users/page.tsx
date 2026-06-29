import Link from "next/link";
import type { Session } from "next-auth";
import { Plus, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canViewBarangayUsers, getUserManagementAccessMessage, requireUserManagementSession } from "@/lib/users/access";
import { formatRole } from "@/lib/users/format";
import { formatDate } from "@/lib/certificates/format";

export default async function UsersPage() {
  let session: Awaited<ReturnType<typeof requireUserManagementSession>>;
  const currentSession = await auth();

  try {
    session = await requireUserManagementSession(currentSession);
  } catch (error) {
    return (
      <DashboardShell>
        <UsersFrame session={currentSession}>
          <AccessNotice message={getUserManagementAccessMessage(error)} />
        </UsersFrame>
      </DashboardShell>
    );
  }

  if (!canViewBarangayUsers(session.role)) {
    return (
      <DashboardShell>
        <UsersFrame session={currentSession}>
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
        session={currentSession}
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

function UsersFrame({
  children,
  action,
  session,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="System"
        title="User Management"
        description="Create and manage barangay staff accounts for this tenant."
        action={action}
      />
      <CurrentSessionPanel session={session} />
      {children}
    </div>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}

function CurrentSessionPanel({ session }: { session?: Session | null }) {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-950">Current Session</h2>
      <dl className="mt-3 grid gap-2 sm:grid-cols-3">
        <div>
          <dt className="font-medium text-slate-500">Role:</dt>
          <dd className="mt-1 break-words text-slate-950">{session?.user?.role ?? "None"}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">BarangayId:</dt>
          <dd className="mt-1 break-words text-slate-950">{session?.user?.barangayId ?? "None"}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Email:</dt>
          <dd className="mt-1 break-words text-slate-950">{session?.user?.email ?? "None"}</dd>
        </div>
      </dl>
    </section>
  );
}
