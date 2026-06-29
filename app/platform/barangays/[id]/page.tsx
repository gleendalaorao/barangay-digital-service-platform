import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, ExternalLink, FileCheck2, Inbox, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { formatPlatformAddress, formatPlatformDate } from "@/lib/platform/format";
import { requirePlatformAdmin } from "@/lib/platform/workspace";
import { openBarangayWorkspace, updateBarangayTenant } from "../../actions";

type BarangayDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ created?: string; updated?: string }>;
};

export default async function BarangayDetailPage({ params, searchParams }: BarangayDetailPageProps) {
  await requirePlatformAdmin();
  const { id } = await params;
  const flags = await searchParams;

  const barangay = await prisma.barangay.findUnique({
    where: { id },
    include: {
      users: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
      _count: {
        select: {
          residents: true,
          households: true,
          certificateRequests: true,
          publicRequests: true,
        },
      },
    },
  });

  if (!barangay) {
    notFound();
  }

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Platform"
          title={barangay.name}
          description={formatPlatformAddress(barangay)}
          action={
            <form action={openBarangayWorkspace.bind(null, barangay.id)}>
              <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open Workspace
              </button>
            </form>
          }
        />

        {flags?.created === "1" ? <Notice message="Barangay tenant and initial admin were created." /> : null}
        {flags?.updated === "1" ? <Notice message="Barangay tenant profile was updated." /> : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Status" value="Active" helper="Tenant workspace is available" icon={Building2} />
          <StatCard label="Residents" value={barangay._count.residents} helper="Tenant registry records" icon={Users} tone="blue" />
          <StatCard label="Households" value={barangay._count.households} helper="Tenant household records" icon={Building2} tone="blue" />
          <StatCard label="Certificates" value={barangay._count.certificateRequests} helper="Tenant certificate records" icon={FileCheck2} tone="gold" />
          <StatCard label="Public requests" value={barangay._count.publicRequests} helper="Tenant online requests" icon={Inbox} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <form action={updateBarangayTenant.bind(null, barangay.id)} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Barangay Profile</h2>
              <p className="mt-1 text-sm text-slate-500">Edit tenant profile basics shown across the platform and public website.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Barangay name" name="name" defaultValue={barangay.name} required />
              <Field label="Public slug" name="slug" defaultValue={barangay.slug} required />
              <Field label="Municipality" name="municipality" defaultValue={barangay.municipality} required />
              <Field label="Province" name="province" defaultValue={barangay.province} required />
              <Field label="Region" name="region" defaultValue={barangay.region} required />
              <Field label="Contact email" name="contactEmail" type="email" defaultValue={barangay.contactEmail ?? ""} />
              <Field label="Contact number" name="contactNumber" defaultValue={barangay.contactNumber ?? ""} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <StatusBadge tone="success">Active</StatusBadge>
              <button type="submit" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
                Save Changes
              </button>
            </div>
          </form>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Tenant Users</h2>
                <p className="mt-1 text-sm text-slate-500">Initial admin and tenant staff accounts.</p>
              </div>
              <StatusBadge tone="info">{barangay.users.length} users</StatusBadge>
            </div>
            <div className="mt-5 divide-y divide-slate-100">
              {barangay.users.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">No users are assigned to this tenant.</p>
              ) : (
                barangay.users.map((user) => (
                  <div key={user.id} className="py-4">
                    <p className="font-medium text-slate-950">{user.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge tone="info">{formatRole(user.role)}</StatusBadge>
                      <StatusBadge tone={user.isActive ? "success" : "neutral"}>{user.isActive ? "Active" : "Inactive"}</StatusBadge>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Created {formatPlatformDate(barangay.createdAt)}. Public portal:{" "}
              <Link href={`/b/${barangay.slug}`} className="font-medium text-emerald-700">
                /b/{barangay.slug}
              </Link>
            </div>
          </section>
        </section>
      </div>
    </DashboardShell>
  );
}

function Notice({ message }: { message: string }) {
  return <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>;
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
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
      />
    </label>
  );
}

function formatRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
