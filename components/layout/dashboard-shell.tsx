import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { getEffectiveSession } from "@/lib/platform/workspace";

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const session = await getEffectiveSession();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role={session?.user?.role ?? null} hasWorkspace={Boolean(session?.user?.barangayId)} />
      <div className="lg:pl-72">
        <Header />
        <main>{children}</main>
      </div>
    </div>
  );
}
