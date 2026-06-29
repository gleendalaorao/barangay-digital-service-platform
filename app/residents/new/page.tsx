import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ResidentForm } from "@/components/residents/resident-form";
import { createResident } from "../actions";

export default function NewResidentPage() {
  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand-700">Resident Registry</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">Add Resident</h1>
        </div>
        <ResidentForm action={createResident} submitLabel="Create Resident" />
      </div>
    </DashboardShell>
  );
}
