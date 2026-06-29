import { Search } from "lucide-react";

export function SearchBar({ name = "q", defaultValue, placeholder }: { name?: string; defaultValue?: string; placeholder: string }) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
      <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="w-full border-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
      />
    </label>
  );
}
