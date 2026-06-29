import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { canManageWebsiteContent, requireWebsiteSession } from "@/lib/website/access";
import { updateWebsiteSettings } from "../actions";

export default async function WebsiteSettingsPage() {
  const session = await requireWebsiteSession();
  const canManage = canManageWebsiteContent(session.role);
  const barangay = await prisma.barangay.findUnique({
    where: { id: session.barangayId },
    include: { settings: true },
  });

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Website" title="Website Settings" description="Update the public website welcome text, images, colors, and contact details." />
        {!canManage ? <AccessNotice message="Staff can view website settings. Only admins and secretaries can edit them." /> : null}
        <form action={updateWebsiteSettings} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Welcome title" name="welcomeTitle" defaultValue={barangay?.settings?.welcomeTitle} disabled={!canManage} />
            <Field label="Public service tagline" name="publicServiceTagline" defaultValue={barangay?.settings?.publicServiceTagline} disabled={!canManage} />
            <TextArea label="Welcome message" name="welcomeMessage" defaultValue={barangay?.settings?.welcomeMessage} disabled={!canManage} />
            <Field label="Logo URL" name="logoUrl" defaultValue={barangay?.settings?.logoUrl} disabled={!canManage} />
            <Field label="Seal URL" name="sealUrl" defaultValue={barangay?.settings?.sealUrl} disabled={!canManage} />
            <FileField label="Logo" name="logoFile" currentUrl={barangay?.settings?.logoUrl} removeName="removeLogo" disabled={!canManage} />
            <FileField label="Seal" name="sealFile" currentUrl={barangay?.settings?.sealUrl} removeName="removeSeal" disabled={!canManage} />
            <Field label="Primary color" name="primaryColor" defaultValue={barangay?.settings?.primaryColor ?? "#047857"} disabled={!canManage} />
            <Field label="Secondary color" name="secondaryColor" defaultValue={barangay?.settings?.secondaryColor ?? "#0f766e"} disabled={!canManage} />
            <Field label="Facebook page URL" name="facebookPageUrl" defaultValue={barangay?.settings?.facebookPageUrl} disabled={!canManage} />
            <Field label="Office hours" name="officeHours" defaultValue={barangay?.settings?.officeHours} disabled={!canManage} />
            <Field label="Contact number" name="contactNumber" defaultValue={barangay?.contactNumber} disabled={!canManage} />
            <Field label="Contact email" name="contactEmail" type="email" defaultValue={barangay?.contactEmail} disabled={!canManage} />
            <TextArea label="Office address" name="officeAddress" defaultValue={barangay?.settings?.officeAddress} disabled={!canManage} />
          </div>
          {canManage ? (
            <div className="flex justify-end border-t border-slate-200 pt-5">
              <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Save Website Settings</button>
            </div>
          ) : null}
        </form>
      </div>
    </DashboardShell>
  );
}

function Field({ label, name, defaultValue, type = "text", disabled }: { label: string; name: string; defaultValue?: string | null; type?: string; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input type={type} name={name} defaultValue={defaultValue ?? ""} disabled={disabled} className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm" />
    </label>
  );
}

function TextArea({ label, name, defaultValue, disabled }: { label: string; name: string; defaultValue?: string | null; disabled?: boolean }) {
  return (
    <label className="block md:col-span-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea name={name} defaultValue={defaultValue ?? ""} disabled={disabled} rows={4} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
    </label>
  );
}

function FileField({ label, name, currentUrl, removeName, disabled }: { label: string; name: string; currentUrl?: string | null; removeName: string; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input type="file" name={name} disabled={disabled} className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm" />
      <p className="mt-1 text-xs text-slate-500">JPG, PNG, or WebP up to 5MB.</p>
      {currentUrl ? (
        <span className="mt-2 block text-xs text-slate-600">
          <img src={currentUrl} alt="" className="mb-2 h-16 w-16 rounded-md object-cover ring-1 ring-slate-200" />
          <a href={currentUrl} className="font-medium text-emerald-700">Preview current image</a>
          <span className="ml-2 inline-flex items-center gap-2">
          <input type="checkbox" name={removeName} disabled={disabled} className="h-3.5 w-3.5" />
          Remove
          </span>
        </span>
      ) : null}
    </label>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
