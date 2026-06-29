import { Bell, Menu } from "lucide-react";
import { auth } from "@/auth";
import { formatBarangayDisplayName, getBarangayInitials } from "@/lib/barangay-display";
import { GlobalSearchInput } from "./global-search-input";

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
        <GlobalSearchInput />
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
