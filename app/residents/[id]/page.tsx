import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ResidentAccessNotice } from "@/components/residents/access-notice";
import { softDeleteResident } from "../actions";
import { prisma } from "@/lib/prisma";
import { getResidentAccessMessage, requireResidentBarangayId } from "@/lib/residents/access";
import { calculateAge, formatResidentName } from "@/lib/residents/format";

type ResidentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResidentDetailPage({ params }: ResidentDetailPageProps) {
  const { id } = await params;
  let barangayId: string;

  try {
    barangayId = await requireResidentBarangayId();
  } catch (error) {
    return (
      <DashboardShell>
        <ResidentDetailFrame title="Resident Record">
          <ResidentAccessNotice message={getResidentAccessMessage(error)} />
        </ResidentDetailFrame>
      </DashboardShell>
    );
  }

  const resident = await prisma.resident.findFirst({
    where: {
      id,
      barangayId,
    },
  });

  if (!resident) {
    notFound();
  }

  return (
    <DashboardShell>
      <ResidentDetailFrame
        title={formatResidentName(resident)}
        action={
          <div className="flex items-center gap-3">
            <Link href={`/residents/${resident.id}/edit`} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-ink-700">
              Edit
            </Link>
            {resident.isActive ? (
              <form action={softDeleteResident}>
                <input type="hidden" name="id" value={resident.id} />
                <button type="submit" className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                  Deactivate
                </button>
              </form>
            ) : null}
          </div>
        }
      >
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-ink-900">Personal Information</h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <Info label="Gender" value={resident.gender} />
                <Info label="Age" value={calculateAge(resident.birthDate)?.toString()} />
                <Info label="Birth date" value={resident.birthDate?.toLocaleDateString("en-PH")} />
                <Info label="Civil status" value={resident.civilStatus} />
                <Info label="Contact number" value={resident.contactNumber} />
                <Info label="Occupation" value={resident.occupation} />
                <Info label="Citizenship" value={resident.citizenship} />
                <Info label="Status" value={resident.isActive ? "Active" : "Inactive"} />
              </dl>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-ink-900">Address Information</h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <Info label="Address" value={resident.addressLine} />
                <Info label="Purok" value={resident.purok} />
                <Info label="Barangay" value={resident.addressBarangay} />
                <Info label="City" value={resident.city} />
                <Info label="Province" value={resident.province} />
              </dl>
            </section>
          </div>

          <div className="space-y-5">
            <Placeholder title="Household" text="Household registry will be connected in a later milestone." />
            <Placeholder title="Certificate History" text="Certificate records will appear here after certificate workflows are implemented." />
          </div>
        </div>
      </ResidentDetailFrame>
    </DashboardShell>
  );
}

function ResidentDetailFrame({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link href="/residents" className="text-sm font-medium text-brand-700">
            Resident Registry
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">{title}</h1>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-1 text-sm text-ink-900">{value || "-"}</dd>
    </div>
  );
}

function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-md border border-dashed border-slate-300 bg-white p-5">
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-ink-500">{text}</p>
    </section>
  );
}
