import type { Announcement } from "@prisma/client";
import { SectionCard } from "@/components/ui/section-card";

type AnnouncementFormProps = {
  announcement?: Pick<Announcement, "title" | "body" | "category" | "isPublished">;
  action: (formData: FormData) => void | Promise<void>;
  mode: "create" | "edit";
};

export function AnnouncementForm({ announcement, action, mode }: AnnouncementFormProps) {
  return (
    <form action={action} className="space-y-6">
      <SectionCard
        title={mode === "create" ? "Announcement details" : "Edit announcement"}
        description="Publish short citizen-facing notices for the public barangay portal."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" name="title" defaultValue={announcement?.title} required />
          <Field label="Category" name="category" defaultValue={announcement?.category} helper="Example: Advisory, Schedule, Community." />
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
        <a href="/announcements" className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
          Cancel
        </a>
        <button type="submit" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
          {mode === "create" ? "Create Announcement" : "Save Changes"}
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
  helper,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950"
      />
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </label>
  );
}
