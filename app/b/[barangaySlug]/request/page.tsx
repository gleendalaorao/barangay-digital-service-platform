import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateType } from "@prisma/client";
import { Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatBarangayDisplayName } from "@/lib/barangay-display";
import { formatCertificateType } from "@/lib/certificates/format";
import { createPublicRequest } from "../actions";

type PublicRequestPageProps = {
  params: Promise<{ barangaySlug: string }>;
};

export default async function PublicRequestPage({ params }: PublicRequestPageProps) {
  const { barangaySlug } = await params;
  const barangay = await prisma.barangay.findUnique({
    where: { slug: barangaySlug },
    select: { name: true, slug: true, municipality: true, province: true },
  });

  if (!barangay) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader barangayName={barangay.name} slug={barangay.slug} />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Building2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">Online Request</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Request a Barangay Document</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                This creates a request for staff review. It does not automatically issue an official document.
              </p>
            </div>
          </div>
        </div>
        <form action={createPublicRequest.bind(null, barangay.slug)} className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Requested Document</h2>
            <p className="mt-1 text-sm text-slate-500">Choose the document type and tell the barangay office why it is needed.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Certificate type</span>
                <select name="certificateType" required className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                  {Object.values(CertificateType).map((type) => (
                    <option key={type} value={type}>
                      {formatCertificateType(type)}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="Purpose" name="purpose" required />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Requester Information</h2>
            <p className="mt-1 text-sm text-slate-500">Use the contact number you will use later to track this request.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="First name" name="firstName" required />
              <Field label="Middle name" name="middleName" />
              <Field label="Last name" name="lastName" required />
              <Field label="Suffix" name="suffix" />
              <Field label="Birth date" name="birthDate" type="date" />
              <Field label="Contact number" name="contactNumber" required />
              <Field label="Email" name="email" type="email" />
              <Field label="Purok" name="purok" />
              <Field label="Address" name="address" required wide />
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-ink-700">Notes</span>
                <textarea name="notes" rows={4} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" />
              </label>
            </div>
          </section>

          <div className="flex items-center justify-end gap-3">
            <Link href={`/b/${barangay.slug}`} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
              Cancel
            </Link>
            <button type="submit" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function PublicHeader({ barangayName, slug }: { barangayName: string; slug: string }) {
  const displayName = formatBarangayDisplayName(barangayName);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link href={`/b/${slug}`} className="text-sm font-semibold text-ink-900">
          {displayName}
        </Link>
        <Link href={`/b/${slug}/track`} className="text-sm font-medium text-brand-700">
          Track Request
        </Link>
      </div>
    </header>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  wide,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "block md:col-span-2" : "block"}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
      />
    </label>
  );
}
