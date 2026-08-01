import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/ui/page-header";
import { getPlatformAccessMessage, requirePlatformAdmin } from "@/lib/platform/workspace";
import { createBarangayTenant } from "../../actions";

export default async function NewBarangayTenantPage() {
  try {
    await requirePlatformAdmin();
  } catch (error) {
    return (
      <DashboardShell>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <AccessNotice message={getPlatformAccessMessage(error)} />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Platform"
          title="Create Barangay Tenant"
          description="Create a tenant workspace and its initial barangay admin user."
        />
        <form action={createBarangayTenant} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <FormSection title="Barangay Profile">
            <Field label="Barangay name" name="name" required placeholder="Barangay San Isidro" />
            <Field label="Public slug" name="slug" required placeholder="san-isidro" />
            <Field label="Municipality" name="municipality" required placeholder="Municipality" />
            <Field label="Province" name="province" required placeholder="Province" />
            <Field label="Region" name="region" required placeholder="Region" />
            <Field label="Contact email" name="contactEmail" type="email" placeholder="office@example.com" />
            <Field label="Contact number" name="contactNumber" placeholder="+63..." />
          </FormSection>

          <FormSection title="Initial Admin User">
            <Field label="Admin name" name="adminName" required placeholder="Barangay Administrator" />
            <Field label="Admin email" name="adminEmail" type="email" required placeholder="admin@example.com" />
            <Field label="Temporary password" name="adminPassword" type="password" required placeholder="At least 8 characters" />
          </FormSection>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
            <Link href="/platform/barangays" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </Link>
            <button type="submit" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
              Create Tenant
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
      />
    </label>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
