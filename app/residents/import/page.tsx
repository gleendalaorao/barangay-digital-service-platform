import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/ui/page-header";
import { getResidentImportAccessMessage, canImportResidents, requireResidentImportSession } from "@/lib/residents/import-access";
import { ResidentImportWizard } from "./import-wizard";

export default async function ResidentImportPage() {
  let session: Awaited<ReturnType<typeof requireResidentImportSession>>;

  try {
    session = await requireResidentImportSession();
  } catch (error) {
    return (
      <DashboardShell>
        <ImportFrame>
          <AccessNotice message={getResidentImportAccessMessage(error)} />
        </ImportFrame>
      </DashboardShell>
    );
  }

  if (!canImportResidents(session.role)) {
    return (
      <DashboardShell>
        <ImportFrame>
          <AccessNotice message="Only barangay admins and secretaries can import residents." />
        </ImportFrame>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <ImportFrame>
        <ResidentImportWizard />
      </ImportFrame>
    </DashboardShell>
  );
}

function ImportFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Resident Records"
        title="Import Residents"
        description="Preview Excel or CSV resident records before saving them to this barangay tenant."
        action={
          <Link href="/residents" className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Residents
          </Link>
        }
      />
      {children}
    </div>
  );
}

function AccessNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>;
}
