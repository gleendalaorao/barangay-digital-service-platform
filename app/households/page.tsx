import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Plus, Search } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { HouseholdAccessNotice } from "@/components/households/access-notice";
import { deactivateHousehold } from "./actions";
import { prisma } from "@/lib/prisma";
import { formatHouseholdAddress } from "@/lib/households/format";
import { getHouseholdAccessMessage, requireHouseholdBarangayId } from "@/lib/households/access";
import { formatResidentName } from "@/lib/residents/format";
import { householdListFilterSchema } from "@/lib/validation/household";

type HouseholdsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HouseholdsPage({ searchParams }: HouseholdsPageProps) {
  const rawSearchParams = await searchParams;
  const filters = householdListFilterSchema.parse({
    householdNo: toSingle(rawSearchParams.householdNo),
    head: toSingle(rawSearchParams.head),
    purok: toSingle(rawSearchParams.purok),
    status: toSingle(rawSearchParams.status),
  });

  let barangayId: string;

  try {
    barangayId = await requireHouseholdBarangayId();
  } catch (error) {
    return (
      <DashboardShell>
        <HouseholdPageFrame title="Household Registry">
          <HouseholdAccessNotice message={getHouseholdAccessMessage(error)} />
        </HouseholdPageFrame>
      </DashboardShell>
    );
  }

  const where: Prisma.HouseholdWhereInput = {
    barangayId,
    ...(filters.status === "inactive"
      ? { isActive: false }
      : filters.status === "all"
        ? {}
        : { isActive: true }),
    ...(filters.householdNo
      ? { householdNo: { contains: filters.householdNo, mode: "insensitive" } }
      : {}),
    ...(filters.purok ? { purok: { contains: filters.purok, mode: "insensitive" } } : {}),
    ...(filters.head
      ? {
          headResident: {
            OR: [
              { firstName: { contains: filters.head, mode: "insensitive" } },
              { middleName: { contains: filters.head, mode: "insensitive" } },
              { lastName: { contains: filters.head, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const [households, puroks] = await Promise.all([
    prisma.household.findMany({
      where,
      include: {
        headResident: true,
        _count: {
          select: {
            residents: true,
          },
        },
      },
      orderBy: [{ householdNo: "asc" }],
      take: 100,
    }),
    prisma.household.findMany({
      where: { barangayId },
      distinct: ["purok"],
      select: { purok: true },
      orderBy: { purok: "asc" },
    }),
  ]);

  return (
    <DashboardShell>
      <HouseholdPageFrame
        title="Household Registry"
        action={
          <Link href="/households/new" className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Household
          </Link>
        }
      >
        <form className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" action="/households">
          <div className="grid gap-3 lg:grid-cols-[180px_1fr_160px_140px_auto]">
            <input
              type="search"
              name="householdNo"
              defaultValue={filters.householdNo ?? ""}
              placeholder="Household no."
              className="h-11 rounded-md border border-slate-200 px-3 text-sm text-ink-900 outline-none focus:border-brand-500"
            />
            <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
              <Search className="h-4 w-4 text-ink-500" aria-hidden="true" />
              <input
                type="search"
                name="head"
                defaultValue={filters.head ?? ""}
                placeholder="Search household head"
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
                <th className="px-4 py-3">Household number</th>
                <th className="px-4 py-3">Household head</th>
                <th className="px-4 py-3">Purok</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {households.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink-500">
                    No household records found.
                  </td>
                </tr>
              ) : (
                households.map((household) => (
                  <tr key={household.id} className="align-middle">
                    <td className="px-4 py-3 font-medium text-ink-900">{household.householdNo}</td>
                    <td className="px-4 py-3 text-ink-700">
                      {household.headResident ? formatResidentName(household.headResident) : "-"}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{household.purok ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-700">{formatHouseholdAddress(household)}</td>
                    <td className="px-4 py-3 text-ink-700">{household._count.residents}</td>
                    <td className="px-4 py-3">
                      <span className={household.isActive ? "text-brand-700" : "text-ink-500"}>
                        {household.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/households/${household.id}`} className="font-medium text-brand-700">
                          View
                        </Link>
                        <Link href={`/households/${household.id}/edit`} className="font-medium text-ink-700">
                          Edit
                        </Link>
                        {household.isActive ? (
                          <form action={deactivateHousehold}>
                            <input type="hidden" name="id" value={household.id} />
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
      </HouseholdPageFrame>
    </DashboardShell>
  );
}

function HouseholdPageFrame({
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
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand-700">Household Records</p>
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
