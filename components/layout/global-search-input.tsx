"use client";

import { Search } from "lucide-react";
import { useEffect, useRef } from "react";

export function GlobalSearchInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <form action="/search" className="flex h-10 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500 shadow-inner focus-within:border-brand-500 focus-within:bg-white">
      <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        name="q"
        placeholder="Search residents, households, certificates, requests"
        className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink-900 outline-none placeholder:text-slate-500"
        aria-label="Global search"
        aria-keyshortcuts="Control+K Meta+K"
      />
    </form>
  );
}
