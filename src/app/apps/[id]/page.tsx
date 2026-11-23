/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Download, Package, Pencil, UserRound } from "lucide-react";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatBytes, formatDate, initials } from "@/lib/format";
import type { AppRecord } from "@/lib/types";
import { PlatformBadge } from "@/components/platform-badge";
import { InstallButton } from "@/components/install-button";

export const dynamic = "force-dynamic";

export default async function AppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const { rows } = await query<AppRecord>(
    `SELECT a.*, u.name AS owner_name FROM apps a
     JOIN users u ON u.id = a.owner_id
     WHERE a.id = $1`,
    [id]
  );
  const app = rows[0];
  if (!app) notFound();

  const canEdit = Boolean(session && (session.id === app.owner_id || session.is_admin));
  const fileName = app.file_url?.split("/").pop()?.replace(/^[0-9a-f-]{36}-/i, "") ?? null;

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="group rise-in inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft
          size={15}
          className="transition-transform duration-300 group-hover:-translate-x-1"
        />
        Back to all apps
      </Link>

      <section
        className="rise-in relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(79,70,229,0.4)] sm:p-8"
        style={{ "--delay": "80ms" } as React.CSSProperties}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {app.icon_url ? (
            <img
              src={app.icon_url}
              alt=""
              className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-md transition-transform duration-500 hover:scale-105 hover:rotate-3"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-xl font-semibold text-indigo-600 shadow-sm">
              {initials(app.name)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <PlatformBadge platform={app.platform} />
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 transition-colors duration-300 hover:bg-slate-200">
                {app.category}
              </span>
              <span className="text-xs text-slate-400">v{app.version}</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {app.name}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              by <span className="font-medium text-slate-700">{app.owner_name || "a student developer"}</span>
            </p>

            <div className="mt-7">
              <InstallButton
                id={app.id}
                platform={app.platform}
                installMethod={app.install_method}
                fileName={fileName}
              />
            </div>
          </div>

          {canEdit && (
            <Link
              href={`/apps/${app.id}/edit`}
              className="btn-soft group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
            >
              <Pencil
                size={14}
                className="transition-transform duration-300 group-hover:rotate-12"
              />
              Edit
            </Link>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <section
            className="rise-in rounded-2xl border border-slate-200/80 bg-white p-6"
            style={{ "--delay": "160ms" } as React.CSSProperties}
          >
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">About this app</h2>
            <div className="mt-3 h-px w-10 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {app.description || "The developer hasn't added a description yet."}
            </p>
          </section>

          {app.screenshots && app.screenshots.length > 0 && (
            <section
              className="rise-in rounded-2xl border border-slate-200/80 bg-white p-6"
              style={{ "--delay": "220ms" } as React.CSSProperties}
            >
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Screenshots</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {app.screenshots.map((url, index) => (
                  <img
                    key={url + index}
                    src={url}
                    alt={`${app.name} screenshot ${index + 1}`}
                    className="card-lift aspect-[9/16] w-full rounded-xl border border-slate-100 object-cover"
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside
          className="rise-in h-fit rounded-2xl border border-slate-200/80 bg-white p-6"
          style={{ "--delay": "280ms" } as React.CSSProperties}
        >
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">Details</h2>
          <dl className="mt-5 space-y-5 text-sm">
            <div className="flex items-start gap-3">
              <Package size={16} className="mt-0.5 shrink-0 text-indigo-400" />
              <div className="min-w-0">
                <dt className="text-xs text-slate-400">Package</dt>
                <dd className="truncate text-slate-700">{app.package_name}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Download size={16} className="mt-0.5 shrink-0 text-indigo-400" />
              <div>
                <dt className="text-xs text-slate-400">Downloads</dt>
                <dd className="font-semibold text-slate-700">{app.downloads}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays size={16} className="mt-0.5 shrink-0 text-indigo-400" />
              <div>
                <dt className="text-xs text-slate-400">Published</dt>
                <dd className="text-slate-700">{formatDate(app.created_at)}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <UserRound size={16} className="mt-0.5 shrink-0 text-indigo-400" />
              <div>
                <dt className="text-xs text-slate-400">Developer</dt>
                <dd className="text-slate-700">{app.owner_name}</dd>
              </div>
            </div>
            {app.file_size && Number(app.file_size) > 0 && (
              <div className="flex items-start gap-3">
                <Download size={16} className="mt-0.5 shrink-0 text-indigo-400" />
                <div>
                  <dt className="text-xs text-slate-400">File size</dt>
                  <dd className="text-slate-700">{formatBytes(Number(app.file_size))}</dd>
                </div>
              </div>
            )}
          </dl>
        </aside>
      </div>
    </div>
  );
}
