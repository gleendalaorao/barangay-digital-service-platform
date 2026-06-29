import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { HouseholdAccessNotice } from "@/components/households/access-notice";
import { HouseholdForm } from "@/components/households/household-form";
import { updateHousehold } from "../../actions";
import { prisma } from "@/lib/prisma";
import { getHouseholdAccessMessage, requireHouseholdBarangayId } from "@/lib/households/access";

type EditHouseholdPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditHouseholdPage({ params }: EditHouseholdPageProps) {
  const { id } = await params;
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

  const [household, residents] = await Promise.all([
    prisma.household.findFirst({
      where: {
        id,
        barangayId,
      },
    }),
    prisma.resident.findMany({
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
    }),
  ]);

  if (!household) {
    notFound();
  }

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand-700">Household Registry</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">Edit Household {household.householdNo}</h1>
        </div>
        <HouseholdForm
          action={updateHousehold.bind(null, household.id)}
          household={household}
          residents={residents}
          submitLabel="Save Changes"
        />
      </div>
    </DashboardShell>
  );
}
