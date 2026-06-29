import type { LucideIcon } from "lucide-react";

export function EmptyState({ title, description, icon: Icon }: { title: string; description?: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
      {Icon ? (
        <div className="mb-4 rounded-md bg-white p-3 text-slate-500 shadow-sm">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      ) : null}
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      {description ? <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p> : null}
    </div>
  );
}
