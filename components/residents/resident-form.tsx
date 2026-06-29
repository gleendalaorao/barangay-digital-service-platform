import type { Resident } from "@prisma/client";
import { formatDateForInput } from "@/lib/residents/format";

type ResidentFormProps = {
  resident?: Resident;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
};

const genderOptions = ["Female", "Male", "Prefer not to say"];
const civilStatusOptions = ["Single", "Married", "Widowed", "Separated"];

export function ResidentForm({ resident, action, submitLabel }: ResidentFormProps) {
  return (
    <form action={action} className="space-y-8">
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ink-900">Personal Information</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="First name" name="firstName" defaultValue={resident?.firstName} required />
          <Field label="Middle name" name="middleName" defaultValue={resident?.middleName} />
          <Field label="Last name" name="lastName" defaultValue={resident?.lastName} required />
          <Field label="Suffix" name="suffix" defaultValue={resident?.suffix} />
          <Select label="Gender" name="gender" defaultValue={resident?.gender} options={genderOptions} />
          <Field
            label="Birth date"
            name="birthDate"
            type="date"
            defaultValue={formatDateForInput(resident?.birthDate)}
          />
          <Select
            label="Civil status"
            name="civilStatus"
            defaultValue={resident?.civilStatus}
            options={civilStatusOptions}
          />
          <Field label="Contact number" name="contactNumber" defaultValue={resident?.contactNumber} />
          <Field label="Occupation" name="occupation" defaultValue={resident?.occupation} />
          <Field label="Citizenship" name="citizenship" defaultValue={resident?.citizenship ?? "Filipino"} />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ink-900">Address Information</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Address" name="address" defaultValue={resident?.addressLine} required />
          <Field label="Purok" name="purok" defaultValue={resident?.purok} />
          <Field label="Barangay" name="barangay" defaultValue={resident?.addressBarangay} />
          <Field label="City" name="city" defaultValue={resident?.city} />
          <Field label="Province" name="province" defaultValue={resident?.province} />
          <label className="flex h-11 items-center gap-3 self-end rounded-md border border-slate-200 px-3 text-sm text-ink-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={resident?.isActive ?? true}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            Active resident record
          </label>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <a href="/residents" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-ink-700">
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
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
