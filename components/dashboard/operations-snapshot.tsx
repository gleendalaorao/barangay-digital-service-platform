import type { DashboardMetric } from "@/lib/dashboard/data";

export function OperationsSnapshot({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((item) => (
        <div key={item.label} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-ink-500">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold text-ink-900">{item.value.toLocaleString()}</p>
          <p className="mt-2 text-xs leading-5 text-ink-500">{item.helper}</p>
        </div>
      ))}
    </section>
  );
}
