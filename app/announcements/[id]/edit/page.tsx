import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { PageHeader } from "@/components/ui/page-header";
import {
  canManageAnnouncements,
  getAnnouncementAccessMessage,
  requireAnnouncementSession,
} from "@/lib/announcements/access";
import { prisma } from "@/lib/prisma";
import { updateAnnouncement } from "../../actions";

type EditAnnouncementPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAnnouncementPage({ params }: EditAnnouncementPageProps) {
  const { id } = await params;
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
          <AccessNotice message="Only admins and secretaries can edit announcements." />
        </PageFrame>
      </DashboardShell>
    );
  }

  const announcement = await prisma.announcement.findFirst({
    where: {
      id,
      barangayId: session.barangayId,
    },
    select: {
      title: true,
      body: true,
      category: true,
      isPublished: true,
    },
  });

  if (!announcement) {
    notFound();
  }

  return (
    <DashboardShell>
      <PageFrame title={`Edit ${announcement.title}`}>
        <AnnouncementForm action={updateAnnouncement.bind(null, id)} announcement={announcement} mode="edit" />
      </PageFrame>
    </DashboardShell>
  );
}

function PageFrame({ children, title = "Edit Announcement" }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Barangay" title={title} description="Update public notice content and publication status." />
      {children}
    </div>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
