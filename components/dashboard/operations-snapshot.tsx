import type { DashboardMetric } from "@/lib/dashboard/data";
import { StatCard } from "@/components/ui/stat-card";
import { Award, FileClock, Home, Inbox, Send, UserPlus, Users } from "lucide-react";

const icons = [Users, Home, Award, FileClock, Send, Inbox, Award, UserPlus];
const tones = ["emerald", "blue", "gold", "warning", "blue", "gold", "emerald", "blue"] as const;

export function OperationsSnapshot({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((item, index) => (
        <StatCard
          key={item.label}
          label={item.label}
          value={item.value}
          helper={item.helper}
          icon={icons[index]}
          tone={tones[index] === "warning" ? "gold" : tones[index]}
        />
      ))}
    </section>
  );
}
