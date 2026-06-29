import Link from "next/link";
import { notFound } from "next/navigation";
import { Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatBarangayDisplayName } from "@/lib/barangay-display";

type Props = { params: Promise<{ barangaySlug: string }> };

export default async function PublicServicesPage({ params }: Props) {
  const { barangaySlug } = await params;
  const barangay = await prisma.barangay.findUnique({
    where: { slug: barangaySlug },
    include: {
      publicServices: { where: { isPublished: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }] },
    },
  });
  if (!barangay) notFound();
  return (
    <PublicShell title="Services" barangayName={barangay.name} slug={barangay.slug}>
      <div className="grid gap-4 md:grid-cols-2">
        {barangay.publicServices.length === 0 ? (
          <Empty icon={Wrench} text="Services will be posted soon." />
        ) : (
          barangay.publicServices.map((service) => (
            <article key={service.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">{service.name}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{service.description}</p>
              {service.requirements ? <Info label="Requirements" value={service.requirements} /> : null}
              {service.processingTime ? <Info label="Processing time" value={service.processingTime} /> : null}
              {service.feeText ? <Info label="Fee" value={service.feeText} /> : null}
              {service.attachmentUrl ? <Link href={service.attachmentUrl} className="mt-3 inline-block text-sm font-medium text-emerald-700">Open service attachment</Link> : null}
              <Link href={service.requestLink || `/b/${barangay.slug}/request`} className="mt-4 inline-block text-sm font-medium text-emerald-700">Request or ask about this service</Link>
            </article>
          ))
        )}
      </div>
    </PublicShell>
  );
}

function PublicShell({ title, barangayName, slug, children }: { title: string; barangayName: string; slug: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-slate-50"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6"><Link href={`/b/${slug}`} className="text-sm font-semibold text-slate-950">{formatBarangayDisplayName(barangayName)}</Link><Link href={`/b/${slug}/resident/login`} className="text-sm font-medium text-emerald-700">Resident Login</Link></div></header><section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6"><h1 className="text-3xl font-semibold text-slate-950">{title}</h1><div className="mt-6">{children}</div></section></main>;
}
function Info({ label, value }: { label: string; value: string }) { return <p className="mt-3 text-sm text-slate-600"><span className="font-semibold text-slate-950">{label}:</span> {value}</p>; }
function Empty({ icon: Icon, text }: { icon: typeof Wrench; text: string }) { return <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm md:col-span-2"><Icon className="mx-auto mb-3 h-6 w-6 text-emerald-700" />{text}</div>; }
