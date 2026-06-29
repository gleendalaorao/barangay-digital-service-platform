import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { PageHeader } from "@/components/ui/page-header";
import { canManageWebsiteContent, requireWebsiteSession } from "@/lib/website/access";
import { createAnnouncement } from "@/app/announcements/actions";

export default async function NewWebsiteAnnouncementPage() {
  const session = await requireWebsiteSession();

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Website" title="New Announcement" description="Post a simple public update for residents." />
        {canManageWebsiteContent(session.role) ? (
          <AnnouncementForm action={createAnnouncement} mode="create" cancelHref="/website/announcements" redirectBase="/website/announcements" />
        ) : (
          <AccessNotice message="Only admins and secretaries can create website posts." />
        )}
      </div>
    </DashboardShell>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
