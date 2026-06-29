import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateType } from "@prisma/client";
import { Building2, Clock, FileText, Mail, Phone, Search } from "lucide-react";
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
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              <Building2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">Online Citizen Services</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Barangay {barangay.name}</h1>
              <p className="mt-2 text-slate-500">
            {barangay.municipality}, {barangay.province}
          </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <Info icon={Building2} label="Office address" value={barangay.settings?.officeAddress} />
            <Info icon={Phone} label="Contact number" value={barangay.contactNumber} />
            <Info icon={Clock} label="Office hours" value={barangay.settings?.officeHours} />
            <Info icon={Mail} label="Email" value={barangay.contactEmail} />
          </div>
          <div className="mt-6 grid gap-3 sm:flex">
            <Link href={`/b/${barangay.slug}/request`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Request Document
            </Link>
            <Link href={`/b/${barangay.slug}/track`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
              <Search className="h-4 w-4" aria-hidden="true" />
              Track Request
            </Link>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-slate-950">Available Online Services</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {Object.values(CertificateType).map((type) => (
              <div key={type} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-950">{formatCertificateType(type)} request</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
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
    <main className="min-h-screen bg-slate-50">
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

function Info({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2">{value || "-"}</p>
    </div>
  );
}
