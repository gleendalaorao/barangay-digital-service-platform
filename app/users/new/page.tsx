import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/ui/page-header";
import { UserForm } from "@/components/users/user-form";
import { createBarangayUser } from "../actions";
import { canMutateBarangayUsers, getUserManagementAccessMessage, requireUserManagementSession } from "@/lib/users/access";

export default async function NewUserPage() {
  let session: Awaited<ReturnType<typeof requireUserManagementSession>>;

  try {
    session = await requireUserManagementSession();
  } catch (error) {
    return (
      <DashboardShell>
        <PageFrame>
          <AccessNotice message={getUserManagementAccessMessage(error)} />
        </PageFrame>
      </DashboardShell>
    );
  }

  if (!canMutateBarangayUsers(session.role)) {
    return (
      <DashboardShell>
        <PageFrame>
          <AccessNotice message="Only barangay admins can create user accounts." />
        </PageFrame>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageFrame>
        <UserForm action={createBarangayUser} mode="create" />
      </PageFrame>
    </DashboardShell>
  );
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader eyebrow="System" title="Create User" description="Add a barangay-level account with a temporary password." />
      {children}
    </div>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
