import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/prisma";
import {
  getBarangaySettingsAccessMessage,
  requireBarangaySettingsSession,
} from "@/lib/barangay-settings/access";
import { updateBarangaySettings } from "./actions";

export default async function BarangaySettingsPage() {
  let session: Awaited<ReturnType<typeof requireBarangaySettingsSession>>;

  try {
    session = await requireBarangaySettingsSession();
  } catch (error) {
    return (
      <DashboardShell>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            {getBarangaySettingsAccessMessage(error)}
          </div>
        </div>
      </DashboardShell>
    );
  }

  const barangay = await prisma.barangay.findFirst({
    where: {
      id: session.barangayId,
    },
    include: {
      settings: true,
    },
  });

  if (!barangay) {
    return (
      <DashboardShell>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            Barangay record was not found.
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand-700">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">Barangay Identity</h1>
          <p className="mt-2 text-sm text-ink-500">
            These details appear in the public portal and official certificate templates.
          </p>
        </div>

        <form action={updateBarangaySettings} className="space-y-8">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink-900">Barangay Profile</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Barangay name" name="name" defaultValue={barangay.name} required />
              <Field label="Barangay code" name="barangayCode" defaultValue={barangay.settings?.certificatePrefix ?? "BRGY"} required />
              <Field label="Public slug" name="slug" defaultValue={barangay.slug} required />
              <Field label="Region" name="region" defaultValue={barangay.region} required />
              <Field label="Province" name="province" defaultValue={barangay.province} required />
              <Field label="City/Municipality" name="municipality" defaultValue={barangay.municipality} required />
              <Field label="Office address" name="officeAddress" defaultValue={barangay.settings?.officeAddress} wide />
              <Field label="Contact number" name="contactNumber" defaultValue={barangay.contactNumber} />
              <Field label="Email" name="email" type="email" defaultValue={barangay.contactEmail} />
              <Field label="Office hours" name="officeHours" defaultValue={barangay.settings?.officeHours} />
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink-900">Officials</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Barangay captain name" name="captainName" defaultValue={barangay.settings?.captainName} />
              <Field label="Secretary name" name="secretaryName" defaultValue={barangay.settings?.secretaryName} />
              <Field label="Treasurer name" name="treasurerName" defaultValue={barangay.settings?.treasurerName} />
              <Field label="SK chairperson name" name="skChairpersonName" defaultValue={barangay.settings?.skChairpersonName} />
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink-900">Certificate Identity</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Official header line 1" name="officialHeaderLine1" defaultValue={barangay.settings?.officialHeaderLine1} />
              <Field label="Official header line 2" name="officialHeaderLine2" defaultValue={barangay.settings?.officialHeaderLine2} />
              <Field label="Official header line 3" name="officialHeaderLine3" defaultValue={barangay.settings?.officialHeaderLine3} />
              <Field label="Certificate footer note" name="certificateFooterNote" defaultValue={barangay.settings?.certificateFooterNote} wide />
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink-900">Logo and Seal</h2>
            <p className="mt-1 text-sm text-ink-500">Use image URLs for now. File upload will be added in a later milestone.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Barangay logo URL" name="logoUrl" type="url" defaultValue={barangay.settings?.logoUrl} />
              <Field label="Barangay seal URL" name="sealUrl" type="url" defaultValue={barangay.settings?.sealUrl} />
            </div>
          </section>

          <div className="flex justify-end">
            <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  wide,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "block md:col-span-2" : "block"}>
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
