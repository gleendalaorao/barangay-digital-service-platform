"use client";

import { Printer } from "lucide-react";

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      Print Report
    </button>
  );
}
