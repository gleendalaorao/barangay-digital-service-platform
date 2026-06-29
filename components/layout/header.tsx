import { Bell, Command, Menu, Search } from "lucide-react";
import { auth } from "@/auth";
import { formatBarangayDisplayName, getBarangayInitials } from "@/lib/barangay-display";

export async function Header() {
  const session = await auth();
  const workspaceName = formatBarangayDisplayName(session?.user?.barangayName);
  const workspaceInitials = getBarangayInitials(session?.user?.barangayName);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-ink-700 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex h-10 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500 shadow-inner">
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">Search residents, requests, or certificate logs</span>
          <span className="ml-auto hidden items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-slate-400 sm:inline-flex">
            <Command className="h-3 w-3" /> K
          </span>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="hidden min-w-0 items-center gap-3 sm:flex">
          <div className="h-10 w-10 rounded-lg bg-emerald-600 text-center text-sm font-semibold leading-10 text-white shadow-sm">
            {workspaceInitials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{workspaceName}</p>
            <p className="truncate text-xs text-slate-500">Admin workspace</p>
          </div>
        </div>
      </div>
    </header>
  );
}
