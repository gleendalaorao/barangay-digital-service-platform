import Link from "next/link";
import { Megaphone, Plus } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  canManageAnnouncements,
  canPublishAnnouncements,
  canViewAnnouncements,
  getAnnouncementAccessMessage,
  requireAnnouncementSession,
} from "@/lib/announcements/access";
import { formatDate, formatDateTime } from "@/lib/certificates/format";
import { prisma } from "@/lib/prisma";
import { setAnnouncementPublished } from "./actions";

export default async function AnnouncementsPage() {
  let session: Awaited<ReturnType<typeof requireAnnouncementSession>>;

  try {
    session = await requireAnnouncementSession();
  } catch (error) {
    return (
      <DashboardShell>
        <AnnouncementsFrame>
          <AccessNotice message={getAnnouncementAccessMessage(error)} />
        </AnnouncementsFrame>
      </DashboardShell>
    );
  }

  if (!canViewAnnouncements(session.role)) {
    return (
      <DashboardShell>
        <AnnouncementsFrame>
          <AccessNotice message="You do not have permission to view announcements." />
        </AnnouncementsFrame>
      </DashboardShell>
    );
  }

  const canManage = canManageAnnouncements(session.role);
  const canPublish = canPublishAnnouncements(session.role);
  const announcements = await prisma.announcement.findMany({
    where: {
      barangayId: session.barangayId,
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <DashboardShell>
      <AnnouncementsFrame
        action={
          canManage ? (
            <Link href="/announcements/new" className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Announcement
            </Link>
          ) : undefined
        }
      >
        <DataTable>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Published</th>
                <th>Created by</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState title="No announcements yet" description="Create short notices for residents visiting the public portal." icon={Megaphone} />
                  </td>
                </tr>
              ) : (
                announcements.map((announcement) => (
                  <tr key={announcement.id}>
                    <td className="max-w-sm">
                      <p className="font-medium text-slate-950">{announcement.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{announcement.body}</p>
                    </td>
                    <td className="text-slate-700">{announcement.category || "-"}</td>
                    <td>
                      <StatusBadge tone={announcement.isPublished ? "success" : "neutral"}>
                        {announcement.isPublished ? "Published" : "Draft"}
                      </StatusBadge>
                    </td>
                    <td className="whitespace-nowrap text-slate-700">{formatDate(announcement.publishedAt)}</td>
                    <td className="text-slate-700">{announcement.createdBy?.name ?? "System"}</td>
                    <td className="whitespace-nowrap text-slate-700">{formatDateTime(announcement.updatedAt)}</td>
                    <td>
                      <div className="flex flex-wrap items-center gap-3">
                        {canManage ? (
                          <Link href={`/announcements/${announcement.id}/edit`} className="font-medium text-emerald-700">
                            Edit
                          </Link>
                        ) : null}
                        {canPublish ? (
                          <form action={setAnnouncementPublished.bind(null, announcement.id, !announcement.isPublished)}>
                            <button type="submit" className="font-medium text-blue-700">
                              {announcement.isPublished ? "Unpublish" : "Publish"}
                            </button>
                          </form>
                        ) : null}
                        {!canManage && !canPublish ? <span className="text-slate-400">View only</span> : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTable>
      </AnnouncementsFrame>
    </DashboardShell>
  );
}

function AnnouncementsFrame({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Barangay"
        title="Announcements"
        description="Manage short public notices for the barangay portal."
        action={action}
      />
      {children}
    </div>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
