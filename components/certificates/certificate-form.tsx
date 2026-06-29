import { CertificateType, type Resident } from "@prisma/client";
import { formatCertificateType } from "@/lib/certificates/format";
import { formatResidentName } from "@/lib/residents/format";

type ResidentOption = Pick<Resident, "id" | "firstName" | "middleName" | "lastName" | "suffix" | "purok">;

type CertificateFormProps = {
  residents: ResidentOption[];
  action: (formData: FormData) => void | Promise<void>;
};

export function CertificateForm({ residents, action }: CertificateFormProps) {
  return (
    <form action={action} className="space-y-8">
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ink-900">Certificate Request</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-ink-700">Resident</span>
            <select
              name="residentId"
              required
              className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Search/select active resident</option>
              {residents.map((resident) => (
                <option key={resident.id} value={resident.id}>
                  {formatResidentName(resident)}
                  {resident.purok ? ` - ${resident.purok}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-700">Certificate type</span>
            <select
              name="certificateType"
              required
              className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              {Object.values(CertificateType).map((type) => (
                <option key={type} value={type}>
                  {formatCertificateType(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-700">Purpose</span>
            <input
              type="text"
              name="purpose"
              required
              className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-ink-700">Remarks</span>
            <textarea
              name="remarks"
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <a href="/certificates" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-ink-700">
          Cancel
        </a>
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          Create Certificate
        </button>
      </div>
    </form>
  );
}
