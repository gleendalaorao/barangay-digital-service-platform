import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { SearchCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatBarangayDisplayName } from "@/lib/barangay-display";
import { TrackRequestForm } from "./track-request-form";

type TrackPageProps = {
  params: Promise<{ barangaySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TrackRequestPage({ params, searchParams }: TrackPageProps) {
  const { barangaySlug } = await params;
  const rawSearchParams = await searchParams;
  const barangay = await prisma.barangay.findUnique({
    where: { slug: barangaySlug },
    select: { id: true, name: true, slug: true },
  });

  if (!barangay) {
    notFound();
  }

  const submitted = toSingle(rawSearchParams.submitted) === "1";
  const cookieStore = await cookies();
  const initialRequestNumber = submitted ? cookieStore.get("public_request_submission")?.value ?? "" : "";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href={`/b/${barangay.slug}`} className="text-sm font-semibold text-ink-900">
            {formatBarangayDisplayName(barangay.name)}
          </Link>
          <Link href={`/b/${barangay.slug}/request`} className="text-sm font-medium text-brand-700">
            Request Document
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <SearchCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">Request Tracking</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Track Document Request</h1>
              {submitted ? (
                <p className="mt-2 text-sm text-emerald-700">
                  Your request was submitted. Keep your request number and contact number for tracking.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <TrackRequestForm barangaySlug={barangay.slug} initialRequestNumber={initialRequestNumber} />
      </div>
    </main>
  );
}

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
