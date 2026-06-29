import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatBarangayDisplayName } from "@/lib/barangay-display";

type Props = { params: Promise<{ barangaySlug: string }> };

export default async function PublicContactPage({ params }: Props) {
  const { barangaySlug } = await params;
  const barangay = await prisma.barangay.findUnique({ where: { slug: barangaySlug }, include: { settings: true } });
  if (!barangay) notFound();
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6"><Link href={`/b/${barangay.slug}`} className="text-sm font-semibold text-slate-950">{formatBarangayDisplayName(barangay.name)}</Link><Link href={`/b/${barangay.slug}/request`} className="text-sm font-medium text-emerald-700">Request Document</Link></div></header>
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold text-slate-950">Contact</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Info icon={MapPin} label="Office address" value={barangay.settings?.officeAddress} />
          <Info icon={Phone} label="Contact number" value={barangay.contactNumber} />
          <Info icon={Mail} label="Email" value={barangay.contactEmail} />
          <Info icon={Clock} label="Office hours" value={barangay.settings?.officeHours} />
        </div>
        {barangay.settings?.facebookPageUrl ? <Link href={barangay.settings.facebookPageUrl} className="mt-6 inline-block text-sm font-medium text-emerald-700">Open Facebook page</Link> : null}
      </section>
    </main>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value?: string | null }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm font-semibold text-slate-950"><Icon className="h-5 w-5 text-emerald-700" />{label}</div><p className="mt-3 text-sm text-slate-600">{value || "-"}</p></div>;
}
