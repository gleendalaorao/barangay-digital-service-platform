import { DatabaseBackup, FileUp, Globe2, Inbox, Search } from "lucide-react";
import { ActionCard } from "@/components/ui/action-card";

export function DashboardActionGrid({ publicPortalHref }: { publicPortalHref: string }) {
  const actions = [
  {
    name: "Import Residents",
    description: "Bring resident records into the tenant registry.",
    icon: FileUp,
    href: "/residents/import",
  },
  {
    name: "Backup & Restore",
    description: "Export or restore workspace records for office continuity.",
    icon: DatabaseBackup,
    href: "/settings/backup",
  },
  {
    name: "Global Search",
    description: "Search residents, households, certificates, and public requests.",
    icon: Search,
    href: "/search",
  },
  {
    name: "Public Portal",
    description: "Open the citizen-facing request and tracking page.",
    icon: Globe2,
    href: publicPortalHref,
  },
  {
    name: "Review Requests",
    description: "Process public requests that need staff action.",
    icon: Inbox,
    href: "/requests",
  },
];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {actions.map((action) => (
        <ActionCard
          key={action.name}
          title={action.name}
          description={action.description}
          href={action.href}
          icon={action.icon}
        />
      ))}
    </section>
  );
}
