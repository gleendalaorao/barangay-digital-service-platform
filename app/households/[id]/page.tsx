import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { HouseholdAccessNotice } from "@/components/households/access-notice";
import { addHouseholdMember, deactivateHousehold, removeHouseholdMember } from "../actions";
import { prisma } from "@/lib/prisma";
import { formatHouseholdAddress } from "@/lib/households/format";
import { getHouseholdAccessMessage, requireHouseholdBarangayId } from "@/lib/households/access";
import { calculateAge, formatResidentName } from "@/lib/residents/format";

type HouseholdDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HouseholdDetailPage({ params }: HouseholdDetailPageProps) {
  const { id } = await params;
  let barangayId: string;

  try {
    barangayId = await requireHouseholdBarangayId();
  } catch (error) {
    return (
      <DashboardShell>
        <HouseholdDetailFrame title="Household Record">
          <HouseholdAccessNotice message={getHouseholdAccessMessage(error)} />
        </HouseholdDetailFrame>
      </DashboardShell>
    );
  }

  const household = await prisma.household.findFirst({
    where: {
      id,
      barangayId,
    },
    include: {
      headResident: true,
      residents: {
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
    },
  });

  if (!household) {
    notFound();
  }

  const availableResidents = await prisma.resident.findMany({
    where: {
      barangayId,
      isActive: true,
      householdId: null,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      suffix: true,
    },
  });

  return (
    <DashboardShell>
      <HouseholdDetailFrame
        title={`Household ${household.householdNo}`}
        action={
          <div className="flex items-center gap-3">
            <Link href={`/households/${household.id}/edit`} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-ink-700">
              Edit
            </Link>
            {household.isActive ? (
              <form action={deactivateHousehold}>
                <input type="hidden" name="id" value={household.id} />
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
              <h2 className="text-lg font-semibold text-ink-900">Household Information</h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <Info label="Household number" value={household.householdNo} />
                <Info label="Household head" value={household.headResident ? formatResidentName(household.headResident) : null} />
                <Info label="Purok" value={household.purok} />
                <Info label="Address" value={formatHouseholdAddress(household)} />
                <Info label="Status" value={household.isActive ? "Active" : "Inactive"} />
                <Info label="Members" value={household.residents.length.toString()} />
              </dl>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold text-ink-900">Members</h2>
                  <p className="mt-1 text-sm text-ink-500">Assign active residents from this barangay to the household.</p>
                </div>
                <form action={addHouseholdMember.bind(null, household.id)} className="flex gap-2">
                  <select name="residentId" className="h-10 min-w-56 rounded-md border border-slate-200 bg-white px-3 text-sm">
                    <option value="">Select resident</option>
                    {availableResidents.map((resident) => (
                      <option key={resident.id} value={resident.id}>
                        {formatResidentName(resident)}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="h-10 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white">
                    Add
                  </button>
                </form>
              </div>

              <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Gender</th>
                      <th className="px-4 py-3">Age</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {household.residents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-ink-500">
                          No residents assigned to this household.
                        </td>
                      </tr>
                    ) : (
                      household.residents.map((resident) => (
                        <tr key={resident.id}>
                          <td className="px-4 py-3 font-medium text-ink-900">{formatResidentName(resident)}</td>
                          <td className="px-4 py-3 text-ink-700">{resident.gender ?? "-"}</td>
                          <td className="px-4 py-3 text-ink-700">{calculateAge(resident.birthDate) ?? "-"}</td>
                          <td className="px-4 py-3 text-ink-700">{resident.contactNumber ?? "-"}</td>
                          <td className="px-4 py-3">
                            <form action={removeHouseholdMember.bind(null, household.id)}>
                              <input type="hidden" name="residentId" value={resident.id} />
                              <button type="submit" className="font-medium text-red-700">
                                Remove
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="rounded-md border border-dashed border-slate-300 bg-white p-5">
            <h2 className="text-lg font-semibold text-ink-900">Household Reports</h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Household summaries and reporting tools will be added in a later milestone.
            </p>
          </section>
        </div>
      </HouseholdDetailFrame>
    </DashboardShell>
  );
}

function HouseholdDetailFrame({
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
          <Link href="/households" className="text-sm font-medium text-brand-700">
            Household Registry
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
