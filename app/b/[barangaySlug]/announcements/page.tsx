import Link from "next/link";
import { notFound } from "next/navigation";
import { Megaphone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatBarangayDisplayName } from "@/lib/barangay-display";
import { formatDate } from "@/lib/certificates/format";

type Props = { params: Promise<{ barangaySlug: string }> };

export default async function PublicAnnouncementsPage({ params }: Props) {
  const { barangaySlug } = await params;
  const barangay = await prisma.barangay.findUnique({
    where: { slug: barangaySlug },
    select: {
      name: true,
      slug: true,
      announcements: {
        where: { isPublished: true },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      },
    },
  });
  if (!barangay) notFound();

  return (
    <PublicPage title="Announcements" barangayName={barangay.name} slug={barangay.slug}>
      <div className="grid gap-4">
        {barangay.announcements.length === 0 ? (
          <Empty icon={Megaphone} text="No public announcements are available right now." />
        ) : (
          barangay.announcements.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              {item.featuredImageUrl ? <img src={item.featuredImageUrl} alt="" className="mb-4 max-h-72 w-full rounded-md object-cover" /> : null}
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{item.category || "Announcement"}</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-1 text-xs text-slate-500">{formatDate(item.publishedAt)}</p>
              <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{item.body}</p>
              {item.attachmentUrl ? <Link href={item.attachmentUrl} className="mt-4 inline-block text-sm font-medium text-emerald-700">Open attachment</Link> : null}
            </article>
          ))
        )}
      </div>
    </PublicPage>
  );
}

function PublicPage({ title, barangayName, slug, children }: { title: string; barangayName: string; slug: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href={`/b/${slug}`} className="text-sm font-semibold text-slate-950">{formatBarangayDisplayName(barangayName)}</Link>
          <Link href={`/b/${slug}/request`} className="text-sm font-medium text-emerald-700">Request Document</Link>
        </div>
      </header>
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold text-slate-950">{title}</h1>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof Megaphone; text: string }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm"><Icon className="mx-auto mb-3 h-6 w-6 text-emerald-700" />{text}</div>;
}
