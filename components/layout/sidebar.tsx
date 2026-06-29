import {
  BarChart3,
  BookOpenCheck,
  FileCheck2,
  Home,
  Inbox,
  LayoutDashboard,
  Search,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, current: true },
  { name: "Resident Search", href: "/residents", icon: Search, current: false },
  { name: "Resident Registry", href: "/residents", icon: Users, current: false },
  { name: "Certificates", href: "/certificates/new", icon: FileCheck2, current: false },
  { name: "Logbook", href: "/certificates", icon: BookOpenCheck, current: false },
  { name: "Requests", href: "#", icon: Inbox, current: false },
  { name: "Households", href: "/households", icon: Home, current: false },
  { name: "Reports", href: "#", icon: BarChart3, current: false },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Barangay DSP
          </p>
          <h2 className="mt-2 text-lg font-semibold text-ink-900">Service Platform</h2>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
                item.current
                  ? "bg-brand-50 text-brand-900"
                  : "text-ink-700 hover:bg-slate-100 hover:text-ink-900",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{item.name}</span>
            </a>
          ))}
        </nav>
        <div className="border-t border-slate-200 px-6 py-5">
          <p className="text-sm font-medium text-ink-900">MVP Foundation</p>
          <p className="mt-1 text-xs leading-5 text-ink-500">
            Multi-tenant architecture prepared for barangay-owned records.
          </p>
        </div>
      </div>
    </aside>
  );
}
