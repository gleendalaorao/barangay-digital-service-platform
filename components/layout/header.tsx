import { Bell, Menu, Search } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-ink-700 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex h-10 flex-1 items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-ink-500">
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">Search residents, requests, or certificate logs</span>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-ink-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="hidden min-w-0 items-center gap-3 sm:flex">
          <div className="h-10 w-10 rounded-md bg-brand-600 text-center text-sm font-semibold leading-10 text-white">
            SB
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">Sample Barangay</p>
            <p className="truncate text-xs text-ink-500">Admin workspace</p>
          </div>
        </div>
      </div>
    </header>
  );
}
