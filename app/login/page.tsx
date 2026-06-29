import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
};

function getSafeCallbackUrl(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(params?.callbackUrl);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl px-4 py-8 lg:grid-cols-[1fr_420px] lg:items-center lg:gap-12 lg:px-8">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-600 text-lg font-semibold text-white shadow-sm">
              BD
            </div>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Barangay Digital</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              Secure workspace for barangay service operations
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Sign in to manage residents, households, certificates, public requests, announcements, reports, and
              tenant settings in one protected dashboard.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <div className="lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-base font-semibold text-white shadow-sm">
                BD
              </div>
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700 lg:mt-0">Welcome back</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Sign in to your account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use your barangay staff email and password to continue.
            </p>
            <LoginForm callbackUrl={callbackUrl} />
          </div>
        </section>
      </div>
    </main>
  );
}
