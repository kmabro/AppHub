"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { CATEGORIES } from "@/lib/types";

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const category = searchParams.get("category") ?? "";
  const platform = searchParams.get("platform") ?? "";
  const sort = searchParams.get("sort") ?? "newest";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          update("q", query.trim());
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search apps, developers, package names…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(event) => update("category", event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 sm:flex-none"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={platform}
            onChange={(event) => update("platform", event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400"
          >
            <option value="">All platforms</option>
            <option value="android">Android</option>
            <option value="ios">iOS</option>
          </select>
          <select
            value={sort}
            onChange={(event) => update("sort", event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most downloaded</option>
            <option value="name">Name A–Z</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
