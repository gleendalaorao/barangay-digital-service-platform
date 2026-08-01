import Link from "next/link";
import { notFound } from "next/navigation";
import { LogIn } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatBarangayDisplayName } from "@/lib/barangay-display";
import { loginResident } from "../actions";

type ResidentLoginPageProps = {
  params: Promise<{ barangaySlug: string }>;
  searchParams: Promise<{ rateLimited?: string }>;
};

export default async function ResidentLoginPage({ params, searchParams }: ResidentLoginPageProps) {
  const { barangaySlug } = await params;
  const { rateLimited } = await searchParams;
  const barangay = await prisma.barangay.findUnique({
    where: { slug: barangaySlug },
    select: { name: true, slug: true },
  });

  if (!barangay) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href={`/b/${barangay.slug}`} className="text-sm font-semibold text-ink-900">
            {formatBarangayDisplayName(barangay.name)}
          </Link>
          <Link href={`/b/${barangay.slug}/signup`} className="text-sm font-medium text-brand-700">
            Sign up
          </Link>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <LogIn className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">Resident Login</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Open your resident dashboard</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">Resident login is separate from barangay staff accounts.</p>
            </div>
          </div>
        </section>
        {rateLimited ? <RateLimitAlert retryAfter={rateLimited} /> : null}
        <form action={loginResident.bind(null, barangay.slug)} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <Field label="Email" name="email" type="email" required />
            <Field label="Password" name="password" type="password" required />
          </div>
          <button type="submit" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
            Login
          </button>
        </form>
      </div>
    </main>
  );
}

function RateLimitAlert({ retryAfter }: { retryAfter: string }) {
  const seconds = Number(retryAfter);
  const minutes = Number.isFinite(seconds) ? Math.max(1, Math.ceil(seconds / 60)) : 15;
  return <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Too many attempts. Try again in {minutes} minute{minutes === 1 ? "" : "s"}.</div>;
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input type={type} name={name} required={required} className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" />
    </label>
  );
}
