import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BlobUploadForm } from "@/components/uploads/blob-upload-form";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAnnouncementAccessMessage } from "@/lib/announcements/access";
import { prisma } from "@/lib/prisma";
import { canManageWebsiteContent, requireWebsiteSession } from "@/lib/website/access";
import { savePublicOfficial } from "../actions";

export default async function WebsiteOfficialsPage() {
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
  const officials = await prisma.publicOfficial.findMany({
    where: { barangayId: session.barangayId },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Website" title="Officials" description="Manage the officials shown on the public website." />
        {canManage ? <OfficialForm barangayId={session.barangayId} /> : <AccessNotice message="Staff can view officials. Only admins and secretaries can edit them." />}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {officials.map((official) => (
            <BlobUploadForm
              key={official.id}
              action={savePublicOfficial}
              barangayId={session.barangayId}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              uploadFields={[{ fileField: "photoFile", blobUrlField: "photoBlobUrl", folder: "officials", kind: "image" }]}
            >
              <input type="hidden" name="id" value={official.id} />
              <OfficialFields official={official} disabled={!canManage} />
              <div className="mt-4 flex items-center justify-between gap-3">
                <StatusBadge tone={official.isPublished ? "success" : "neutral"}>{official.isPublished ? "Published" : "Hidden"}</StatusBadge>
                {canManage ? <button className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Save</button> : null}
              </div>
            </BlobUploadForm>
          ))}
        </section>
      </div>
    </DashboardShell>
  );
}

function OfficialForm({ barangayId }: { barangayId: string }) {
  return (
    <BlobUploadForm
      action={savePublicOfficial}
      barangayId={barangayId}
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      uploadFields={[{ fileField: "photoFile", blobUrlField: "photoBlobUrl", folder: "officials", kind: "image" }]}
    >
      <h2 className="text-base font-semibold text-slate-950">Add official</h2>
      <OfficialFields />
      <button className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Add Official</button>
    </BlobUploadForm>
  );
}

function OfficialFields({ official, disabled }: { official?: { name: string; position: string; contact: string | null; photoUrl: string | null; displayOrder: number; isPublished: boolean }; disabled?: boolean }) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <Field label="Name" name="name" defaultValue={official?.name} required disabled={disabled} />
      <Field label="Position" name="position" defaultValue={official?.position} required disabled={disabled} />
      <Field label="Contact" name="contact" defaultValue={official?.contact} disabled={disabled} />
      <Field label="Photo URL" name="photoUrl" defaultValue={official?.photoUrl} disabled={disabled} />
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Photo</span>
        <input type="file" name="photoFile" disabled={disabled} className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm" />
        <p className="mt-1 text-xs text-slate-500">JPG, PNG, or WebP up to 5MB.</p>
        {official?.photoUrl ? (
          <span className="mt-2 block text-xs text-slate-600">
            <img src={official.photoUrl} alt="" className="mb-2 h-16 w-16 rounded-full object-cover ring-1 ring-slate-200" />
            <a href={official.photoUrl} className="font-medium text-emerald-700">Preview current photo</a>
            <span className="ml-2 inline-flex items-center gap-2">
            <input type="checkbox" name="removePhoto" disabled={disabled} className="h-3.5 w-3.5" />
            Remove
            </span>
          </span>
        ) : null}
      </label>
      <Field label="Display order" name="displayOrder" type="number" defaultValue={String(official?.displayOrder ?? 0)} disabled={disabled} />
      <label className="flex h-11 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm text-slate-700">
        <input type="checkbox" name="isPublished" defaultChecked={official?.isPublished ?? true} disabled={disabled} />
        Show on website
      </label>
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

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
