/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatDate, initials } from "@/lib/format";
import type { AppRecord } from "@/lib/types";
import { PlatformBadge } from "@/components/platform-badge";
import { DeleteButton } from "@/components/delete-button";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "My apps" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { rows: apps } = await query<AppRecord>(
    `SELECT a.*, u.name AS owner_name FROM apps a
     JOIN users u ON u.id = a.owner_id
     WHERE a.owner_id = $1
     ORDER BY a.created_at DESC`,
    [session.id]
  );

  const totalDownloads = apps.reduce((sum, app) => sum + app.downloads, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Signed in as {session.email}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Hello, {session.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            You have published {apps.length} {apps.length === 1 ? "app" : "apps"} with{" "}
            {totalDownloads} total downloads.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/apps/new"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <Plus size={16} /> Publish app
          </Link>
          <span className="sm:hidden">
            <LogoutButton />
          </span>
        </div>
      </div>

      {apps.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[1fr_120px_100px_180px] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-400 sm:grid">
            <span>App</span>
            <span>Platform</span>
            <span>Downloads</span>
            <span className="text-right">Actions</span>
          </div>
          {apps.map((app) => (
            <div
              key={app.id}
              className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-[1fr_120px_100px_180px] sm:items-center sm:gap-4"
            >
              <Link href={`/apps/${app.id}`} className="flex min-w-0 items-center gap-3">
                {app.icon_url ? (
                  <img src={app.icon_url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-600">
                    {initials(app.name)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900 hover:text-indigo-700">
                    {app.name}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {app.package_name} · {formatDate(app.created_at)}
                  </span>
                </span>
              </Link>
              <div><PlatformBadge platform={app.platform} /></div>
              <div className="inline-flex items-center gap-1 text-sm text-slate-600">
                <Download size={14} /> {app.downloads}
              </div>
              <div className="flex gap-2 sm:justify-end">
                <Link
                  href={`/apps/${app.id}/edit`}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  Edit
                </Link>
                <DeleteButton id={app.id} name={app.name} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Plus size={22} />
          </div>
          <h2 className="mt-4 font-semibold text-slate-900">No apps yet</h2>
          <p className="mt-1 text-sm text-slate-500">Publish your first app to share it with the class.</p>
          <Link
            href="/apps/new"
            className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Publish an app
          </Link>
        </div>
      )}
    </div>
  );
}
