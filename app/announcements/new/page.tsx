import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { PageHeader } from "@/components/ui/page-header";
import {
  canManageAnnouncements,
  getAnnouncementAccessMessage,
  requireAnnouncementSession,
} from "@/lib/announcements/access";
import { createAnnouncement } from "../actions";

export default async function NewAnnouncementPage() {
  let session: Awaited<ReturnType<typeof requireAnnouncementSession>>;

  try {
    session = await requireAnnouncementSession();
  } catch (error) {
    return (
      <DashboardShell>
        <PageFrame>
          <AccessNotice message={getAnnouncementAccessMessage(error)} />
        </PageFrame>
      </DashboardShell>
    );
  }

  if (!canManageAnnouncements(session.role)) {
    return (
      <DashboardShell>
        <PageFrame>
          <AccessNotice message="Only admins and secretaries can create announcements." />
        </PageFrame>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageFrame>
        <AnnouncementForm action={createAnnouncement} mode="create" barangayId={session.barangayId} />
      </PageFrame>
    </DashboardShell>
  );
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Barangay" title="Create Announcement" description="Draft a short public notice for residents." />
      {children}
    </div>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
