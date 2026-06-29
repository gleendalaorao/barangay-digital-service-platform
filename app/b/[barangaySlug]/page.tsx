import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateType } from "@prisma/client";
import { FileText, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCertificateType } from "@/lib/certificates/format";

type PublicBarangayPageProps = {
  params: Promise<{ barangaySlug: string }>;
};

export default async function PublicBarangayPage({ params }: PublicBarangayPageProps) {
  const { barangaySlug } = await params;
  const barangay = await prisma.barangay.findUnique({
    where: { slug: barangaySlug },
    include: { settings: true },
  });

  if (!barangay) {
    notFound();
  }

  return (
    <PublicShell barangayName={barangay.name}>
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand-700">Online Citizen Services</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink-900">Barangay {barangay.name}</h1>
          <p className="mt-2 text-ink-500">
            {barangay.municipality}, {barangay.province}
          </p>
          <div className="mt-5 grid gap-3 text-sm text-ink-700 sm:grid-cols-2">
            <Info label="Office address" value={barangay.settings?.officeAddress} />
            <Info label="Contact number" value={barangay.contactNumber} />
            <Info label="Office hours" value={barangay.settings?.officeHours} />
            <Info label="Email" value={barangay.contactEmail} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/b/${barangay.slug}/request`} className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Request Document
            </Link>
            <Link href={`/b/${barangay.slug}/track`} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-ink-700">
              <Search className="h-4 w-4" aria-hidden="true" />
              Track Request
            </Link>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-ink-900">Available Online Services</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {Object.values(CertificateType).map((type) => (
              <div key={type} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-ink-900">{formatCertificateType(type)} request</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Submit a request online for barangay staff review and approval.
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </PublicShell>
  );
}

function PublicShell({ barangayName, children }: { barangayName: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f9f8]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-ink-900">
            Barangay {barangayName}
          </Link>
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-brand-700">Public Portal</span>
        </div>
      </header>
      {children}
    </main>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1">{value || "-"}</p>
    </div>
  );
}
