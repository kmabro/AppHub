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

  const conditions: string[] = ["a.status <> 'suspended'"];
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

  const [appsResult, stats, featuredResult] = await Promise.all([
    query<AppRecord>(
      `SELECT a.*, u.name AS owner_name,
              round(avg(r.rating)::numeric, 1) AS avg_rating,
              count(r.id) AS review_count
       FROM apps a
       JOIN users u ON u.id = a.owner_id
       LEFT JOIN reviews r ON r.app_id = a.id
       ${where}
       GROUP BY a.id, u.name
       ORDER BY ${order}
       LIMIT 60`,
      params
    ),
    query<{ apps: string; downloads: string; developers: string }>(
      `SELECT
        (SELECT count(*) FROM apps) AS apps,
        (SELECT COALESCE(sum(downloads), 0) FROM apps) AS downloads,
        (SELECT count(*) FROM users WHERE is_admin = false) AS developers`
    ),
    query<AppRecord>(
      `SELECT a.*, u.name AS owner_name,
              round(avg(r.rating)::numeric, 1) AS avg_rating,
              count(r.id) AS review_count
       FROM apps a JOIN users u ON u.id = a.owner_id
       LEFT JOIN reviews r ON r.app_id = a.id
       WHERE a.featured = true AND a.status = 'published'
       GROUP BY a.id, u.name
       ORDER BY a.created_at DESC
       LIMIT 6`
    ),
  ]);

  const apps = appsResult.rows;
  const s = stats.rows[0];
  const featured = featuredResult.rows;

  return (
    <div className="space-y-10">
      <section className="rise-in relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 px-5 py-10 shadow-[0_20px_60px_-40px_rgba(79,70,229,0.35)] backdrop-blur sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-[0.45] [background-image:radial-gradient(#c7d2fe_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
        <div className="float-soft pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-200/70 to-violet-200/50 blur-3xl" />
        <div className="float-slower pointer-events-none absolute -bottom-36 left-1/4 h-72 w-72 rounded-full bg-gradient-to-br from-sky-200/60 to-indigo-200/50 blur-3xl" />
        <div className="relative max-w-2xl">
          <h1
            className="rise-in text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ "--delay": "180ms" } as React.CSSProperties}
          >
            Discover apps made by <span className="gradient-text">your classmates.</span>
          </h1>
          <p
            className="rise-in mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg"
            style={{ "--delay": "260ms" } as React.CSSProperties}
          >
            Discover what your classmates built. Search by app name or category, open an app, and
            install it on your phone — or publish the one you built in a few clicks.
          </p>
          <div
            className="rise-in mt-8 flex flex-wrap gap-3"
            style={{ "--delay": "340ms" } as React.CSSProperties}
          >
            <Link
              href="/apps/new"
              className="btn-primary group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
            >
              Publish your app
              <ArrowRight size={16} className="arrow-slide" />
            </Link>
            <Link
              href="#browse"
              className="btn-soft group inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
            >
              Browse apps
              <ArrowRight size={15} className="ml-2 rotate-90 arrow-slide" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Layers3, label: "Apps published", value: s?.apps ?? "0" },
          { icon: Download, label: "Total downloads", value: s?.downloads ?? "0" },
          { icon: Users, label: "Total developers", value: s?.developers ?? "0" },
        ].map(({ icon: Icon, label, value }, index) => (
          <div
            key={label}
            style={{ "--delay": `${400 + index * 80}ms` } as React.CSSProperties}
            className="card-lift rise-in flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4"
          >
            <span className="icon-bubble flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600">
              <Icon size={19} />
            </span>
            <div>
              <p className="text-2xl font-semibold leading-none tracking-tight text-slate-900">
                {value}
              </p>
              <p className="mt-1.5 text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </section>

      {featured.length > 0 && (
        <section className="space-y-4">
          <div className="rise-in flex items-end justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-500">
                Featured
              </span>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                Handpicked for the class
              </h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((app, index) => (
              <AppCard key={app.id} app={app} index={index} />
            ))}
          </div>
        </section>
      )}

      <section id="browse" className="scroll-mt-24 space-y-6">
        <div className="rise-in" style={{ "--delay": "480ms" } as React.CSSProperties}>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Find an app</h2>
          <p className="mt-1 text-sm text-slate-500">
            Explore {apps.length} {apps.length === 1 ? "app" : "apps"} shared by your class. Use the
            filters to find one quickly.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="shimmer relative h-16 overflow-hidden rounded-2xl border border-slate-200 bg-white" />
          }
        >
          <div className="rise-in" style={{ "--delay": "540ms" } as React.CSSProperties}>
            <SearchFilters />
          </div>
        </Suspense>

        {apps.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app, index) => (
              <AppCard key={app.id} app={app} index={index} />
            ))}
          </div>
        ) : (
          <div className="rise-in rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center backdrop-blur">
            <div className="icon-bubble mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-500">
              <Layers3 size={24} />
            </div>
            <h3 className="mt-5 font-semibold text-slate-900">No apps found</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
              {q || category || platform
                ? "Try a different search or clear the filters to see more apps."
                : "No apps here yet. Publish yours so your classmates can find it."}
            </p>
            <Link
              href="/apps/new"
              className="btn-primary mt-6 inline-flex rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            >
              Publish an app
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
