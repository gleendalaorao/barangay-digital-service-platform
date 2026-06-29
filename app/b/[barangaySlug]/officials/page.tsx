import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatBarangayDisplayName } from "@/lib/barangay-display";

type Props = { params: Promise<{ barangaySlug: string }> };

export default async function PublicOfficialsPage({ params }: Props) {
  const { barangaySlug } = await params;
  const barangay = await prisma.barangay.findUnique({
    where: { slug: barangaySlug },
    include: { publicOfficials: { where: { isPublished: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }] } },
  });
  if (!barangay) notFound();
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6"><Link href={`/b/${barangay.slug}`} className="text-sm font-semibold text-slate-950">{formatBarangayDisplayName(barangay.name)}</Link><Link href={`/b/${barangay.slug}/contact`} className="text-sm font-medium text-emerald-700">Contact</Link></div></header>
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold text-slate-950">Officials</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {barangay.publicOfficials.length === 0 ? <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm md:col-span-3"><UserRound className="mx-auto mb-3 h-6 w-6 text-emerald-700" />Officials will be posted soon.</div> : barangay.publicOfficials.map((official) => (
            <article key={official.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              {official.photoUrl ? <img src={official.photoUrl} alt="" className="mb-4 h-32 w-32 rounded-full object-cover" /> : null}
              <h2 className="font-semibold text-slate-950">{official.name}</h2>
              <p className="mt-1 text-sm font-medium text-emerald-700">{official.position}</p>
              {official.contact ? <p className="mt-2 text-sm text-slate-500">{official.contact}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
