import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateType } from "@prisma/client";
import { Building2, Clock, FileText, LogIn, Mail, Megaphone, Phone, Search, UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatBarangayDisplayName } from "@/lib/barangay-display";
import { formatCertificateType, formatDate } from "@/lib/certificates/format";

type PublicBarangayPageProps = {
  params: Promise<{ barangaySlug: string }>;
};

export default async function PublicBarangayPage({ params }: PublicBarangayPageProps) {
  const { barangaySlug } = await params;
  const barangay = await prisma.barangay.findUnique({
    where: { slug: barangaySlug },
    include: {
      settings: true,
      announcements: {
        where: {
          isPublished: true,
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 5,
      },
      publicServices: {
        where: { isPublished: true },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        take: 6,
      },
      publicOfficials: {
        where: { isPublished: true },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        take: 6,
      },
    },
  });

  if (!barangay) {
    notFound();
  }

  const displayName = formatBarangayDisplayName(barangay.name);

  return (
    <PublicShell barangayName={displayName} slug={barangay.slug}>
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              {barangay.settings?.logoUrl?.trim() ? (
                <img
                  src={barangay.settings.logoUrl}
                  alt={`${displayName} logo`}
                  className="h-12 w-12 object-contain"
                />
              ) : (
                <Building2 className="h-8 w-8" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">Online Citizen Services</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{barangay.settings?.welcomeTitle || displayName}</h1>
              <p className="mt-2 text-slate-500">
                {barangay.settings?.welcomeMessage || `${barangay.municipality}, ${barangay.province}`}
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
            <Link href={`/b/${barangay.slug}/signup`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Resident Sign Up
            </Link>
            <Link href={`/b/${barangay.slug}/resident/login`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Resident Login
            </Link>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Services</h2>
            <Link href={`/b/${barangay.slug}/services`} className="text-sm font-medium text-emerald-700">View all</Link>
          </div>
          <p className="mt-1 text-sm text-slate-500">{barangay.settings?.publicServiceTagline || "Common barangay services available to residents."}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {barangay.publicServices.length === 0 ? (
              Object.values(CertificateType).map((type) => (
                <div key={type} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-950">{formatCertificateType(type)} request</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Submit a request online for barangay staff review and approval.</p>
                </div>
              ))
            ) : (
              barangay.publicServices.map((service) => (
                <div key={service.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-950">{service.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{service.description}</p>
                  {service.requestLink ? <Link href={service.requestLink} className="mt-3 inline-block text-sm font-medium text-emerald-700">Start request</Link> : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Officials</h2>
            <Link href={`/b/${barangay.slug}/officials`} className="text-sm font-medium text-emerald-700">View all</Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {barangay.publicOfficials.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm md:col-span-3">Officials will be posted soon.</div>
            ) : (
              barangay.publicOfficials.map((official) => (
                <div key={official.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-950">{official.name}</h3>
                  <p className="mt-1 text-sm text-emerald-700">{official.position}</p>
                  {official.contact ? <p className="mt-2 text-sm text-slate-500">{official.contact}</p> : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-950">Barangay Announcements</h2>
          </div>
          <div className="mt-4 grid gap-4">
            {barangay.announcements.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                No public announcements are available right now.
              </div>
            ) : (
              barangay.announcements.map((announcement) => (
                <article key={announcement.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                        {announcement.category || "Announcement"}
                      </p>
                      <h3 className="mt-2 font-semibold text-slate-950">{announcement.title}</h3>
                    </div>
                    <p className="whitespace-nowrap text-xs text-slate-500">{formatDate(announcement.publishedAt)}</p>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{announcement.body}</p>
                </article>
              ))
            )}
          </div>
          <Link href={`/b/${barangay.slug}/announcements`} className="mt-4 inline-block text-sm font-medium text-emerald-700">View all announcements</Link>
        </section>
      </section>
    </PublicShell>
  );
}

function PublicShell({ barangayName, slug, children }: { barangayName: string; slug: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href={`/b/${slug}`} className="text-sm font-semibold text-ink-900">
            {barangayName}
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-slate-600 sm:flex">
            <Link href={`/b/${slug}`}>Home</Link>
            <Link href={`/b/${slug}/announcements`}>Announcements</Link>
            <Link href={`/b/${slug}/services`}>Services</Link>
            <Link href={`/b/${slug}/officials`}>Officials</Link>
            <Link href={`/b/${slug}/contact`}>Contact</Link>
          </nav>
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-brand-700">Public Website</span>
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
