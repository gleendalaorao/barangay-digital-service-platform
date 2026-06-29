import type { Household, Resident } from "@prisma/client";
import { formatResidentName } from "@/lib/residents/format";

type ResidentOption = Pick<Resident, "id" | "firstName" | "middleName" | "lastName" | "suffix">;

type HouseholdFormProps = {
  household?: Household;
  residents: ResidentOption[];
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
};

export function HouseholdForm({ household, residents, action, submitLabel }: HouseholdFormProps) {
  return (
    <form action={action} className="space-y-8">
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ink-900">Household Information</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Household number" name="householdNo" defaultValue={household?.householdNo} required />
          <Field label="Purok" name="purok" defaultValue={household?.purok} />
          <Field label="Address" name="address" defaultValue={household?.addressLine} required />
          <Field label="Barangay" name="barangay" defaultValue={household?.addressBarangay} />
          <Field label="City" name="city" defaultValue={household?.city} />
          <Field label="Province" name="province" defaultValue={household?.province} />
          <label className="block">
            <span className="text-sm font-medium text-ink-700">Household head</span>
            <select
              name="headResidentId"
              defaultValue={household?.headResidentId ?? ""}
              className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Select active resident</option>
              {residents.map((resident) => (
                <option key={resident.id} value={resident.id}>
                  {formatResidentName(resident)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex h-11 items-center gap-3 self-end rounded-md border border-slate-200 px-3 text-sm text-ink-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={household?.isActive ?? true}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            Active household record
          </label>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <a href="/households" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-ink-700">
          Cancel
        </a>
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}
