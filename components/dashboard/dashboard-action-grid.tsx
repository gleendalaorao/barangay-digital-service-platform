import { BookOpenCheck, FilePlus2, Inbox, Search, Settings, UserPlus } from "lucide-react";
import { ActionCard } from "@/components/ui/action-card";

const actions = [
  {
    name: "Search Resident",
    description: "Find resident records before preparing requests or documents.",
    icon: Search,
    href: "/residents",
  },
  {
    name: "Add Resident",
    description: "Prepare the registry for controlled resident intake.",
    icon: UserPlus,
    href: "/residents/new",
  },
  {
    name: "Generate Certificate",
    description: "Start certificate preparation after staff verification.",
    icon: FilePlus2,
    href: "/certificates/new",
  },
  {
    name: "Review Requests",
    description: "Review submitted public service requests before approval.",
    icon: Inbox,
    href: "/requests",
  },
  {
    name: "Certificate Logbook",
    description: "Track document status, release dates, and control numbers.",
    icon: BookOpenCheck,
    href: "/certificates",
  },
  {
    name: "Barangay Settings",
    description: "Update public identity, officials, and certificate header details.",
    icon: Settings,
    href: "/settings/barangay",
  },
];

export function DashboardActionGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
