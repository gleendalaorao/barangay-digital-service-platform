"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

export function ExportButton({ href, label }: { href: string; label: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <a
      href={href}
      onClick={() => {
        setLoading(true);
        window.setTimeout(() => setLoading(false), 1600);
      }}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
      {loading ? "Preparing..." : label}
    </a>
  );
}
