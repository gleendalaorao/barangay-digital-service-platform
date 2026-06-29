import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { canManageWebsiteContent, requireWebsiteSession } from "@/lib/website/access";
import { updateAnnouncement } from "@/app/announcements/actions";

type Props = { params: Promise<{ id: string }> };

export default async function EditWebsiteAnnouncementPage({ params }: Props) {
  const { id } = await params;
  const session = await requireWebsiteSession();
  const announcement = await prisma.announcement.findFirst({
    where: { id, barangayId: session.barangayId },
    select: { title: true, body: true, category: true, featuredImageUrl: true, attachmentUrl: true, isPublished: true, publishedAt: true },
  });

  if (!announcement) notFound();

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Website" title="Edit Announcement" description="Update the public post residents see." />
        {canManageWebsiteContent(session.role) ? (
          <AnnouncementForm action={updateAnnouncement.bind(null, id)} announcement={announcement} mode="edit" cancelHref="/website/announcements" redirectBase="/website/announcements" />
        ) : (
          <AccessNotice message="Only admins and secretaries can edit website posts." />
        )}
      </div>
    </DashboardShell>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
