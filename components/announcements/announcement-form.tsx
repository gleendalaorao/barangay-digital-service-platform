import type { Announcement } from "@prisma/client";
import { SectionCard } from "@/components/ui/section-card";

type AnnouncementFormProps = {
  announcement?: Pick<Announcement, "title" | "body" | "category" | "featuredImageUrl" | "attachmentUrl" | "isPublished" | "publishedAt">;
  action: (formData: FormData) => void | Promise<void>;
  mode: "create" | "edit";
  cancelHref?: string;
  redirectBase?: string;
};

export function AnnouncementForm({ announcement, action, mode, cancelHref = "/announcements", redirectBase = "/announcements" }: AnnouncementFormProps) {
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="redirectBase" value={redirectBase} />
      <SectionCard
        title="What would you like to announce?"
        description="Post a clear public update for residents, like writing a simple social media announcement."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" name="title" defaultValue={announcement?.title} required />
          <Field label="Category" name="category" defaultValue={announcement?.category} helper="Example: Advisory, Schedule, Community." />
          <Field label="Featured image URL" name="featuredImageUrl" defaultValue={announcement?.featuredImageUrl} helper="Optional image shown on the public website." />
          <Field label="Attachment URL" name="attachmentUrl" defaultValue={announcement?.attachmentUrl} helper="Optional link to a file, form, or supporting page." />
          <FileField label="Featured image" name="featuredImageFile" helper="JPG, PNG, or WebP up to 5MB." currentUrl={announcement?.featuredImageUrl} removeName="removeFeaturedImage" />
          <FileField label="Attachment" name="attachmentFile" helper="PDF, DOC, or DOCX up to 10MB." currentUrl={announcement?.attachmentUrl} removeName="removeAttachment" />
          <Field
            label="Publish date"
            name="publishedAt"
            type="datetime-local"
            defaultValue={formatDateTimeInput(announcement?.publishedAt)}
            helper="Optional. Leave blank to use the time you publish."
          />
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Body</span>
            <textarea
              name="body"
              defaultValue={announcement?.body ?? ""}
              required
              rows={8}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950"
            />
            <p className="mt-1 text-xs text-slate-500">Keep the wording clear and useful for residents.</p>
          </label>
          <label className="flex h-11 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm text-slate-700">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={announcement?.isPublished ?? false}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            Publish on public portal
          </label>
        </div>
      </SectionCard>

      <div className="flex justify-end gap-3">
        <a href={cancelHref} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
          Cancel
        </a>
        <button type="submit" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
          {mode === "create" ? "Create Announcement" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function FileField({
  label,
  name,
  helper,
  currentUrl,
  removeName,
}: {
  label: string;
  name: string;
  helper: string;
  currentUrl?: string | null;
  removeName: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="file"
        name={name}
        className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm"
      />
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
      {currentUrl ? (
        <span className="mt-2 block text-xs text-slate-600">
          <a href={currentUrl} className="font-medium text-emerald-700">Preview current file</a>
          <span className="ml-2 inline-flex items-center gap-2">
          <input type="checkbox" name={removeName} className="h-3.5 w-3.5" />
          Remove
          </span>
        </span>
      ) : null}
    </label>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  helper,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | null;
  required?: boolean;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950"
      />
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </label>
  );
}

function formatDateTimeInput(date?: Date | null) {
  return date ? date.toISOString().slice(0, 16) : "";
}
