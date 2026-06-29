const items = [
  { label: "Resident records", value: "Ready" },
  { label: "Certificate workflow", value: "Prepared" },
  { label: "Public requests", value: "Queued" },
  { label: "Tenant isolation", value: "Enabled" },
];

export function OperationsSnapshot() {
  return (
    <section className="grid gap-4 border-y border-slate-200 py-6 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-sm text-ink-500">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink-900">{item.value}</p>
        </div>
      ))}
    </section>
  );
}
