/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Layers3 } from "lucide-react";
import { query } from "@/lib/db";
import { formatDate, initials } from "@/lib/format";
import type { AppRecord } from "@/lib/types";
import { AppCard } from "@/components/app-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Developer profile" };

export default async function DeveloperPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const { rows: users } = await query<{
    id: string;
    name: string;
    username: string;
    bio: string;
    avatar_url: string | null;
    created_at: string;
  }>("SELECT id, name, username, bio, avatar_url, created_at FROM users WHERE lower(username) = $1", [
    username.toLowerCase(),
  ]);
  const developer = users[0];
  if (!developer) notFound();

  const { rows: apps } = await query<AppRecord>(
    `SELECT a.*, u.name AS owner_name,
            round(avg(r.rating)::numeric, 1) AS avg_rating,
            count(r.id) AS review_count
     FROM apps a JOIN users u ON u.id = a.owner_id
     LEFT JOIN reviews r ON r.app_id = a.id
     WHERE a.owner_id = $1 AND a.status <> 'suspended'
     GROUP BY a.id, u.name
     ORDER BY a.created_at DESC`,
    [developer.id]
  );

  const totalDownloads = apps.reduce((sum, app) => sum + app.downloads, 0);

  return (
    <div className="space-y-6">
      <Link href="/" className="group inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft size={15} className="transition-transform duration-300 group-hover:-translate-x-1" />
        Back to all apps
      </Link>

      <section className="rise-in relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(79,70,229,0.4)] sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {developer.avatar_url ? (
            <img
              src={developer.avatar_url}
              alt=""
              className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-md"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-xl font-semibold text-indigo-600">
              {initials(developer.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {developer.name}
            </h1>
            <p className="mt-1 text-sm text-indigo-600">@{developer.username}</p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
              {developer.bio || "This developer hasn't added a biography yet."}
            </p>
            <p className="mt-2 text-xs text-slate-400">Joined {formatDate(developer.created_at)}</p>
          </div>
          <div className="flex gap-6 sm:flex-col sm:gap-3">
            <div>
              <p className="text-2xl font-semibold text-slate-900">{apps.length}</p>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <Layers3 size={13} /> Apps
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{totalDownloads}</p>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <Download size={13} /> Downloads
              </p>
            </div>
          </div>
        </div>
      </section>

      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Published apps</h2>
        {apps.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app, index) => (
              <AppCard key={app.id} app={app} index={index} />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center text-sm text-slate-500">
            No published apps yet.
          </p>
        )}
      </div>
    </div>
  );
}
