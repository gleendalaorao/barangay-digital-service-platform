import type { TodayWorkload } from "@/lib/dashboard/data";
import { StatCard } from "@/components/ui/stat-card";
import { CheckCircle2, FileClock, Inbox, PackageCheck } from "lucide-react";

export function OperationsSnapshot({ workload }: { workload: TodayWorkload }) {
  const metrics = [
    {
      label: "Pending public requests",
      value: workload.pendingPublicRequests,
      helper: "Submitted, reviewing, info needed, or for approval",
      icon: Inbox,
      tone: "gold" as const,
    },
    {
      label: "Certificates pending approval",
      value: workload.certificatesPendingApproval,
      helper: "Certificate records waiting for approval",
      icon: FileClock,
      tone: "gold" as const,
    },
    {
      label: "Certificates released today",
      value: workload.certificatesReleasedToday,
      helper: "Released date is today",
      icon: CheckCircle2,
      tone: "emerald" as const,
    },
    {
      label: "Requests ready for pickup",
      value: workload.requestsReadyForPickup,
      helper: "Public requests marked ready for pickup",
      icon: PackageCheck,
      tone: "blue" as const,
    },
  ];

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-slate-950">Today's Workload</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((item) => (
        <StatCard
          key={item.label}
          label={item.label}
          value={item.value}
          helper={item.helper}
          icon={item.icon}
          tone={item.tone}
        />
      ))}
      </div>
    </section>
  );
}
