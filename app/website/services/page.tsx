import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BlobUploadForm } from "@/components/uploads/blob-upload-form";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAnnouncementAccessMessage } from "@/lib/announcements/access";
import { prisma } from "@/lib/prisma";
import { canManageWebsiteContent, requireWebsiteSession } from "@/lib/website/access";
import { savePublicService } from "../actions";

export default async function WebsiteServicesPage() {
  let session: Awaited<ReturnType<typeof requireWebsiteSession>>;

  try {
    session = await requireWebsiteSession();
  } catch (error) {
    return (
      <DashboardShell>
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <AccessNotice message={getAnnouncementAccessMessage(error)} />
        </div>
      </DashboardShell>
    );
  }

  const canManage = canManageWebsiteContent(session.role);
  const services = await prisma.publicService.findMany({
    where: { barangayId: session.barangayId },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Website" title="Services" description="Manage public service descriptions, requirements, fees, and request links." />
        {canManage ? <ServiceForm barangayId={session.barangayId} /> : <AccessNotice message="Staff can view services. Only admins and secretaries can edit them." />}
        <section className="grid gap-4 xl:grid-cols-2">
          {services.map((service) => (
            <BlobUploadForm
              key={service.id}
              action={savePublicService}
              barangayId={session.barangayId}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              uploadFields={[{ fileField: "attachmentFile", blobUrlField: "attachmentBlobUrl", folder: "services", kind: "document" }]}
            >
              <input type="hidden" name="id" value={service.id} />
              <ServiceFields service={service} disabled={!canManage} />
              <div className="mt-4 flex items-center justify-between gap-3">
                <StatusBadge tone={service.isPublished ? "success" : "neutral"}>{service.isPublished ? "Published" : "Hidden"}</StatusBadge>
                {canManage ? <button className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Save</button> : null}
              </div>
            </BlobUploadForm>
          ))}
        </section>
      </div>
    </DashboardShell>
  );
}

function ServiceForm({ barangayId }: { barangayId: string }) {
  return (
    <BlobUploadForm
      action={savePublicService}
      barangayId={barangayId}
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      uploadFields={[{ fileField: "attachmentFile", blobUrlField: "attachmentBlobUrl", folder: "services", kind: "document" }]}
    >
      <h2 className="text-base font-semibold text-slate-950">Add service</h2>
      <ServiceFields />
      <button className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Add Service</button>
    </BlobUploadForm>
  );
}

function ServiceFields({ service, disabled }: { service?: { name: string; description: string; requirements: string | null; processingTime: string | null; feeText: string | null; attachmentUrl: string | null; requestLink: string | null; displayOrder: number; isPublished: boolean }; disabled?: boolean }) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <Field label="Service name" name="name" defaultValue={service?.name} required disabled={disabled} />
      <Field label="Processing time" name="processingTime" defaultValue={service?.processingTime} disabled={disabled} />
      <Field label="Fee text" name="feeText" defaultValue={service?.feeText} disabled={disabled} />
      <Field label="Attachment URL" name="attachmentUrl" defaultValue={service?.attachmentUrl} disabled={disabled} />
      <Field label="Request link" name="requestLink" defaultValue={service?.requestLink} disabled={disabled} />
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Attachment</span>
        <input type="file" name="attachmentFile" disabled={disabled} className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm" />
        <p className="mt-1 text-xs text-slate-500">PDF, DOC, or DOCX up to 10MB.</p>
        {service?.attachmentUrl ? (
          <span className="mt-2 block text-xs text-slate-600">
            <a href={service.attachmentUrl} className="font-medium text-emerald-700">Preview current attachment</a>
            <span className="ml-2 inline-flex items-center gap-2">
            <input type="checkbox" name="removeAttachment" disabled={disabled} className="h-3.5 w-3.5" />
            Remove
            </span>
          </span>
        ) : null}
      </label>
      <Field label="Display order" name="displayOrder" type="number" defaultValue={String(service?.displayOrder ?? 0)} disabled={disabled} />
      <label className="flex h-11 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm text-slate-700">
        <input type="checkbox" name="isPublished" defaultChecked={service?.isPublished ?? true} disabled={disabled} />
        Show on website
      </label>
      <TextArea label="Description" name="description" defaultValue={service?.description} required disabled={disabled} />
      <TextArea label="Requirements" name="requirements" defaultValue={service?.requirements} disabled={disabled} />
    </div>
  );
}

function Field({ label, name, defaultValue, type = "text", required, disabled }: { label: string; name: string; defaultValue?: string | null; type?: string; required?: boolean; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue ?? ""} required={required} disabled={disabled} className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm" />
    </label>
  );
}

function TextArea({ label, name, defaultValue, required, disabled }: { label: string; name: string; defaultValue?: string | null; required?: boolean; disabled?: boolean }) {
  return (
    <label className="block md:col-span-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea name={name} defaultValue={defaultValue ?? ""} required={required} disabled={disabled} rows={4} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
    </label>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
