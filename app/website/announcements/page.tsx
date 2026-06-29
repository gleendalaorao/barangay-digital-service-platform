import Link from "next/link";
import { Megaphone, Plus } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/certificates/format";
import { prisma } from "@/lib/prisma";
import { canManageWebsiteContent, canPublishWebsiteContent, requireWebsiteSession } from "@/lib/website/access";
import { setAnnouncementPublished } from "@/app/announcements/actions";

export default async function WebsiteAnnouncementsPage() {
  const session = await requireWebsiteSession();
  const canManage = canManageWebsiteContent(session.role);
  const canPublish = canPublishWebsiteContent(session.role);
  const announcements = await prisma.announcement.findMany({
    where: { barangayId: session.barangayId },
    orderBy: [{ createdAt: "desc" }],
  });

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Website"
          title="Announcements"
          description="Post and manage public updates for residents."
          action={
            canManage ? (
              <Link href="/website/announcements/new" className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                <Plus className="h-4 w-4" aria-hidden="true" />
                New Post
              </Link>
            ) : undefined
          }
        />
        <DataTable>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th>Post</th>
                <th>Category</th>
                <th>Status</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState title="No posts yet" description="Create the first public announcement for residents." icon={Megaphone} />
                  </td>
                </tr>
              ) : (
                announcements.map((announcement) => (
                  <tr key={announcement.id}>
                    <td>
                      <p className="font-medium text-slate-950">{announcement.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{announcement.body}</p>
                    </td>
                    <td className="text-slate-700">{announcement.category ?? "-"}</td>
                    <td>
                      <StatusBadge tone={announcement.isPublished ? "success" : "neutral"}>{announcement.isPublished ? "Published" : "Draft"}</StatusBadge>
                    </td>
                    <td className="text-slate-700">{formatDateTime(announcement.publishedAt)}</td>
                    <td>
                      <div className="flex flex-wrap items-center gap-3">
                        <Link href={`/website/announcements/${announcement.id}/edit`} className="font-medium text-emerald-700">
                          Edit
                        </Link>
                        {canPublish ? (
                          <form action={setAnnouncementPublished.bind(null, announcement.id, !announcement.isPublished)}>
                            <button type="submit" className="font-medium text-blue-700">
                              {announcement.isPublished ? "Unpublish" : "Publish"}
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTable>
      </div>
    </DashboardShell>
  );
}
