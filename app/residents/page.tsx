import Link from "next/link";
import { Prisma } from "@prisma/client";
import { FileUp, Plus, Search } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ResidentAccessNotice } from "@/components/residents/access-notice";
import { auth } from "@/auth";
import { softDeleteResident } from "./actions";
import { prisma } from "@/lib/prisma";
import { getResidentAccessMessage, requireResidentBarangayId } from "@/lib/residents/access";
import { canImportResidents } from "@/lib/residents/import-access";
import { calculateAge, formatResidentName } from "@/lib/residents/format";
import { residentListFilterSchema } from "@/lib/validation/resident";

type ResidentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResidentsPage({ searchParams }: ResidentsPageProps) {
  const rawSearchParams = await searchParams;
  const filters = residentListFilterSchema.parse({
    q: toSingle(rawSearchParams.q),
    purok: toSingle(rawSearchParams.purok),
    gender: toSingle(rawSearchParams.gender),
    status: toSingle(rawSearchParams.status),
  });

  let barangayId: string;

  try {
    barangayId = await requireResidentBarangayId();
  } catch (error) {
    return (
      <DashboardShell>
        <ResidentPageFrame title="Resident Registry">
          <ResidentAccessNotice message={getResidentAccessMessage(error)} />
        </ResidentPageFrame>
      </DashboardShell>
    );
  }

  const where: Prisma.ResidentWhereInput = {
    barangayId,
    ...(filters.status === "inactive"
      ? { isActive: false }
      : filters.status === "all"
        ? {}
        : { isActive: true }),
    ...(filters.purok ? { purok: { contains: filters.purok, mode: "insensitive" } } : {}),
    ...(filters.gender ? { gender: filters.gender } : {}),
    ...(filters.q
      ? {
          OR: [
            { firstName: { contains: filters.q, mode: "insensitive" } },
            { middleName: { contains: filters.q, mode: "insensitive" } },
            { lastName: { contains: filters.q, mode: "insensitive" } },
            { contactNumber: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [residents, puroks, genders] = await Promise.all([
    prisma.resident.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 100,
    }),
    prisma.resident.findMany({
      where: { barangayId },
      distinct: ["purok"],
      select: { purok: true },
      orderBy: { purok: "asc" },
    }),
    prisma.resident.findMany({
      where: { barangayId },
      distinct: ["gender"],
      select: { gender: true },
      orderBy: { gender: "asc" },
    }),
  ]);
  const session = await auth();
  const canImport = canImportResidents(session?.user?.role);

  return (
    <DashboardShell>
      <ResidentPageFrame
        title="Resident Registry"
        action={
          <div className="flex flex-wrap items-center gap-3">
            {canImport ? (
              <Link href="/residents/import" className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                <FileUp className="h-4 w-4" aria-hidden="true" />
                Import Residents
              </Link>
            ) : null}
            <Link href="/residents/new" className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Resident
            </Link>
          </div>
        }
      >
        <form className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" action="/residents">
          <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px_140px_auto]">
            <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
              <Search className="h-4 w-4 text-ink-500" aria-hidden="true" />
              <input
                type="search"
                name="q"
                defaultValue={filters.q ?? ""}
                placeholder="Search name or contact"
                className="w-full border-0 bg-transparent text-sm text-ink-900 outline-none"
              />
            </label>
            <select name="purok" defaultValue={filters.purok ?? ""} className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option value="">All puroks</option>
              {puroks
                .filter((item) => item.purok)
                .map((item) => (
                  <option key={item.purok} value={item.purok ?? ""}>
                    {item.purok}
                  </option>
                ))}
            </select>
            <select name="gender" defaultValue={filters.gender ?? ""} className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option value="">All genders</option>
              {genders
                .filter((item) => item.gender)
                .map((item) => (
                  <option key={item.gender} value={item.gender ?? ""}>
                    {item.gender}
                  </option>
                ))}
            </select>
            <select name="status" defaultValue={filters.status ?? "active"} className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All status</option>
            </select>
            <button type="submit" className="h-11 rounded-md border border-slate-200 px-4 text-sm font-medium text-ink-700">
              Apply
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">Full name</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Purok</th>
                <th className="px-4 py-3">Contact number</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {residents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink-500">
                    No resident records found.
                  </td>
                </tr>
              ) : (
                residents.map((resident) => (
                  <tr key={resident.id} className="align-middle">
                    <td className="px-4 py-3 font-medium text-ink-900">{formatResidentName(resident)}</td>
                    <td className="px-4 py-3 text-ink-700">{resident.gender ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-700">{calculateAge(resident.birthDate) ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-700">{resident.purok ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-700">{resident.contactNumber ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className={resident.isActive ? "text-brand-700" : "text-ink-500"}>
                        {resident.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/residents/${resident.id}`} className="font-medium text-brand-700">
                          View
                        </Link>
                        <Link href={`/residents/${resident.id}/edit`} className="font-medium text-ink-700">
                          Edit
                        </Link>
                        {resident.isActive ? (
                          <form action={softDeleteResident}>
                            <input type="hidden" name="id" value={resident.id} />
                            <button type="submit" className="font-medium text-red-700">
                              Deactivate
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ResidentPageFrame>
    </DashboardShell>
  );
}

function ResidentPageFrame({
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
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand-700">Resident Records</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">{title}</h1>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
