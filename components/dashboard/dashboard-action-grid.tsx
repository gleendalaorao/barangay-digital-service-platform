import { BookOpenCheck, FilePlus2, Inbox, Search, Settings, UserPlus } from "lucide-react";

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
    name: "View Requests",
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
        <a
          key={action.name}
          href={action.href}
          className="group min-h-40 rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-soft"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-50 text-brand-700">
            <action.icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-ink-900">{action.name}</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">{action.description}</p>
        </a>
      ))}
    </section>
  );
}
