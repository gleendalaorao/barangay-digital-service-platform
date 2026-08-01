import Link from "next/link";
import { Megaphone, Settings, UserRound, Wrench } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ActionCard } from "@/components/ui/action-card";
import { PageHeader } from "@/components/ui/page-header";
import { getAnnouncementAccessMessage } from "@/lib/announcements/access";
import { requireWebsiteSession } from "@/lib/website/access";

const cards = [
  { title: "Post Announcement", description: "Share public updates residents can read online.", href: "/website/announcements/new", icon: Megaphone },
  { title: "Announcements", description: "Edit posts and publish or hide updates.", href: "/website/announcements", icon: Megaphone },
  { title: "Services", description: "List services, requirements, fees, and request links.", href: "/website/services", icon: Wrench },
  { title: "Officials", description: "Update the public officials shown on the website.", href: "/website/officials", icon: UserRound },
  { title: "Website Settings", description: "Update welcome text, colors, contact info, and images.", href: "/website/settings", icon: Settings },
];

export default async function WebsitePage() {
  try {
    await requireWebsiteSession();
  } catch (error) {
    return (
      <DashboardShell>
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <AccessNotice message={getAnnouncementAccessMessage(error)} />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Website"
          title="Public Website"
          description="Update your barangay website with simple posts, services, officials, and contact information."
        />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <ActionCard key={card.href} {...card} />
          ))}
        </section>
        <Link href="/" className="text-sm font-medium text-emerald-700">
          Back to dashboard
        </Link>
      </div>
    </DashboardShell>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
