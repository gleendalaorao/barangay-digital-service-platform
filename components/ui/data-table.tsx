export function DataTable({ children }: { children: React.ReactNode }) {
  return <div className="data-table overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">{children}</div>;
}
