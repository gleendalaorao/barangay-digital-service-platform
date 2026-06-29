import { DashboardShell } from "@/components/layout/dashboard-shell";
import { HouseholdAccessNotice } from "@/components/households/access-notice";
import { HouseholdForm } from "@/components/households/household-form";
import { createHousehold } from "../actions";
import { prisma } from "@/lib/prisma";
import { getHouseholdAccessMessage, requireHouseholdBarangayId } from "@/lib/households/access";

export default async function NewHouseholdPage() {
  let barangayId: string;

  try {
    barangayId = await requireHouseholdBarangayId();
  } catch (error) {
    return (
      <DashboardShell>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <HouseholdAccessNotice message={getHouseholdAccessMessage(error)} />
        </div>
      </DashboardShell>
    );
  }

  const residents = await prisma.resident.findMany({
    where: {
      barangayId,
      isActive: true,
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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand-700">Household Registry</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">Add Household</h1>
        </div>
        <HouseholdForm action={createHousehold} residents={residents} submitLabel="Create Household" />
      </div>
    </DashboardShell>
  );
}
