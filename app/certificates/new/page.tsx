import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CertificateAccessNotice } from "@/components/certificates/access-notice";
import { CertificateForm } from "@/components/certificates/certificate-form";
import { createCertificate } from "../actions";
import { getCertificateAccessMessage, requireCertificateSession } from "@/lib/certificates/access";
import { prisma } from "@/lib/prisma";

export default async function NewCertificatePage() {
  let session: Awaited<ReturnType<typeof requireCertificateSession>>;

  try {
    session = await requireCertificateSession();
  } catch (error) {
    return (
      <DashboardShell>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <CertificateAccessNotice message={getCertificateAccessMessage(error)} />
        </div>
      </DashboardShell>
    );
  }

  const residents = await prisma.resident.findMany({
    where: {
      barangayId: session.barangayId,
      isActive: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      suffix: true,
      purok: true,
    },
  });

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand-700">Certificate Generator</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">New Certificate Request</h1>
        </div>
        <CertificateForm action={createCertificate} residents={residents} />
      </div>
    </DashboardShell>
  );
}
