import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ResidentAccessNotice } from "@/components/residents/access-notice";
import { ResidentForm } from "@/components/residents/resident-form";
import { updateResident } from "../../actions";
import { prisma } from "@/lib/prisma";
import { getResidentAccessMessage, requireResidentBarangayId } from "@/lib/residents/access";
import { formatResidentName } from "@/lib/residents/format";

type EditResidentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditResidentPage({ params }: EditResidentPageProps) {
  const { id } = await params;
  let barangayId: string;

  try {
    barangayId = await requireResidentBarangayId();
  } catch (error) {
    return (
      <DashboardShell>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <ResidentAccessNotice message={getResidentAccessMessage(error)} />
        </div>
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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand-700">Resident Registry</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">Edit {formatResidentName(resident)}</h1>
        </div>
        <ResidentForm action={updateResident.bind(null, resident.id)} resident={resident} submitLabel="Save Changes" />
      </div>
    </DashboardShell>
  );
}
