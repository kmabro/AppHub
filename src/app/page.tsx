import Link from "next/link";
import { ArrowRight, Download, Layers3, Users } from "lucide-react";
import { Suspense } from "react";
import { query } from "@/lib/db";
import type { AppRecord } from "@/lib/types";
import { AppCard } from "@/components/app-card";
import { SearchFilters } from "@/components/search-filters";

export const dynamic = "force-dynamic";

type Search = {
  q?: string;
  category?: string;
  platform?: string;
  sort?: string;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const category = (sp.category ?? "").slice(0, 60);
  const platform = (sp.platform ?? "").slice(0, 20);
  const sort = sp.sort ?? "newest";

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (q) {
    params.push(`%${q}%`);
    const i = params.length;
    conditions.push(
      `(a.name ILIKE $${i} OR a.description ILIKE $${i} OR a.package_name ILIKE $${i} OR u.name ILIKE $${i})`
    );
  }
  if (category) {
    params.push(category);
    conditions.push(`a.category = $${params.length}`);
  }
  if (platform === "android" || platform === "ios") {
    params.push(platform);
    conditions.push(`a.platform = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const order =
    sort === "popular"
      ? "a.downloads DESC, a.created_at DESC"
      : sort === "name"
        ? "a.name ASC"
        : "a.created_at DESC";

  const { rows: apps } = await query<AppRecord>(
    `SELECT a.*, u.name AS owner_name FROM apps a
     JOIN users u ON u.id = a.owner_id
     ${where}
     ORDER BY ${order}
     LIMIT 60`,
    params
  );

  const stats = await query<{ apps: string; downloads: string; developers: string }>(
    `SELECT
      (SELECT count(*) FROM apps) AS apps,
      (SELECT COALESCE(sum(downloads), 0) FROM apps) AS downloads,
      (SELECT count(*) FROM users) AS developers`
  );
  const s = stats.rows[0];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-12 sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-100 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-sky-100 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            Built by students, shared with everyone
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Discover apps made by your classmates.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
            AppHub is the simple place to publish a mobile app and share it with the whole class.
            Upload once — everyone can find it and install it from here.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/apps/new"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Publish your app <ArrowRight size={16} />
            </Link>
            <Link
              href="#browse"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Browse apps
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Layers3, label: "Apps published", value: s?.apps ?? "0" },
          { icon: Download, label: "Total downloads", value: s?.downloads ?? "0" },
          { icon: Users, label: "Student developers", value: s?.developers ?? "0" },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Icon size={18} />
            </span>
            <div>
              <p className="text-2xl font-semibold leading-none text-slate-900">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </section>

      <section id="browse" className="scroll-mt-24 space-y-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">All apps</h2>
          <p className="mt-1 text-sm text-slate-500">
            {apps.length} {apps.length === 1 ? "app" : "apps"} available to install
          </p>
        </div>

        <Suspense fallback={<div className="h-16 animate-pulse rounded-2xl bg-white" />}>
          <SearchFilters />
        </Suspense>

        {apps.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Layers3 size={22} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">No apps found</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {q || category || platform
                ? "Try a different search or clear the filters."
                : "Be the first to publish an app for your class."}
            </p>
            <Link
              href="/apps/new"
              className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Publish an app
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
