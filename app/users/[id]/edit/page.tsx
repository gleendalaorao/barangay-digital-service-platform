import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/ui/page-header";
import { UserForm } from "@/components/users/user-form";
import { updateBarangayUser } from "../../actions";
import { prisma } from "@/lib/prisma";
import { canMutateBarangayUsers, getUserManagementAccessMessage, requireUserManagementSession } from "@/lib/users/access";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;
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
          <AccessNotice message="Only barangay admins can edit user accounts." />
        </PageFrame>
      </DashboardShell>
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      id,
      barangayId: session.barangayId,
    },
    select: {
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <DashboardShell>
      <PageFrame title={`Edit ${user.name}`}>
        <UserForm action={updateBarangayUser.bind(null, id)} user={user} mode="edit" />
      </PageFrame>
    </DashboardShell>
  );
}

function PageFrame({ children, title = "Edit User" }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader eyebrow="System" title={title} description="Manage barangay account role, status, and password reset." />
      {children}
    </div>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
