"use client";

import {
  BarChart3,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ScrollText,
  Settings,
  UserCircle,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigationGroups = [
  {
    label: "Dashboard",
    items: [{ name: "Overview", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Citizen Management",
    items: [
      { name: "Residents", href: "/residents", icon: Users },
      { name: "Households", href: "/households", icon: Home },
    ],
  },
  {
    label: "Document Services",
    items: [
      { name: "Certificates", href: "/certificates/new", icon: FileCheck2 },
      { name: "Certificate Logbook", href: "/certificates", icon: BookOpenCheck },
      { name: "Requests", href: "/requests", icon: Inbox },
      { name: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Barangay",
    items: [
      { name: "Announcements", href: "/announcements", icon: Megaphone },
      { name: "Settings", href: "/settings/barangay", icon: Settings },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Users", href: "/users", icon: Users },
      { name: "Audit Logs", href: "/audit-logs", icon: ScrollText },
      { name: "Profile", href: "#", icon: UserCircle },
      { name: "Logout", href: "#", icon: LogOut },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white/95 shadow-sm backdrop-blur lg:block",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-sm">
              BD
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">Barangay Digital</p>
                <p className="truncate text-xs text-slate-500">Service Platform</p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="hidden h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {navigationGroups.map((group) => (
            <div key={group.label}>
              {!collapsed ? (
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{group.label}</p>
              ) : null}
              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href) && item.href !== "#";

                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      title={collapsed ? item.name : undefined}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
                        collapsed && "justify-center px-0",
                        active
                          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      {!collapsed ? <span className="truncate">{item.name}</span> : null}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        {!collapsed ? (
          <div className="border-t border-slate-200 px-5 py-5">
            <p className="text-sm font-medium text-slate-950">SaaS-ready workspace</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Tenant-isolated operations for barangay services.</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
