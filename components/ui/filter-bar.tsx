export function FilterBar({ children, action }: { children: React.ReactNode; action?: string }) {
  return (
    <form action={action} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">{children}</div>
    </form>
  );
}
