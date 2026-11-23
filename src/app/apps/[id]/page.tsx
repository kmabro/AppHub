/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  Package,
  Pencil,
  Star,
  UserRound,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatBytes, formatDate, initials } from "@/lib/format";
import type { AppRecord, AppVersion, Review } from "@/lib/types";
import { PlatformBadge } from "@/components/platform-badge";
import { InstallButton } from "@/components/install-button";
import { DeleteButton } from "@/components/delete-button";
import { ReviewsSection } from "@/components/reviews-section";

export const dynamic = "force-dynamic";

export default async function AppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const { rows } = await query<AppRecord>(
    `SELECT a.*, u.name AS owner_name, u.username AS owner_username,
            round(avg(r.rating)::numeric, 1) AS avg_rating,
            count(r.id) AS review_count
     FROM apps a
     JOIN users u ON u.id = a.owner_id
     LEFT JOIN reviews r ON r.app_id = a.id
     WHERE a.id = $1
     GROUP BY a.id, u.name, u.username`,
    [id]
  );
  const app = rows[0];
  if (!app) notFound();

  const canEdit = Boolean(session && (session.id === app.owner_id || session.is_admin));
  if (app.status === "suspended" && !canEdit) notFound();

  const { rows: allVersions } = await query<AppVersion>(
    "SELECT * FROM app_versions WHERE app_id = $1 ORDER BY created_at DESC",
    [id]
  );
  const versions = canEdit
    ? allVersions
    : allVersions.filter((version) => version.status === "published");
  const pending = versions.filter((version) => version.status === "pending");
  const fileName = app.file_url?.split("/").pop()?.replace(/^[0-9a-f-]{36}-/i, "") ?? null;

  const { rows: reviews } = await query<Review>(
    `SELECT r.*, u.name AS author_name, u.username AS author_username, u.avatar_url AS author_avatar
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.app_id = $1 ORDER BY r.updated_at DESC`,
    [id]
  );
  const average = Number(app.avg_rating ?? 0);
  const reviewCount = Number(app.review_count ?? 0);

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="group rise-in inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={15} className="transition-transform duration-300 group-hover:-translate-x-1" />
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
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {app.category}
              </span>
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                v{app.version}
              </span>
              {app.status === "suspended" && (
                <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                  Suspended
                </span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {app.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>
                by{" "}
                {app.owner_username ? (
                  <Link
                    href={`/developers/${app.owner_username}`}
                    className="font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    {app.owner_name}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-700">{app.owner_name}</span>
                )}
              </span>
              {reviewCount > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-600">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  {average.toFixed(1)} ({reviewCount})
                </span>
              )}
            </div>

            <div className="mt-7">
              <InstallButton
                id={app.id}
                platform={app.platform}
                installMethod={app.install_method}
                fileName={fileName}
              />
            </div>

            {canEdit && pending.length > 0 && (
              <div className="fade-in mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-medium">
                  {pending.length} update{pending.length === 1 ? "" : "s"} awaiting admin review
                </p>
                <p className="mt-0.5 text-xs text-amber-700">
                  Your current published version stays live until an admin approves the new one.
                </p>
              </div>
            )}
          </div>

          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/apps/${app.id}/edit`}
                className="btn-soft group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              >
                <Pencil size={14} className="transition-transform duration-300 group-hover:rotate-12" />
                Edit
              </Link>
              <DeleteButton id={app.id} name={app.name} redirectTo="/dashboard" />
            </div>
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

          <section
            className="rise-in rounded-2xl border border-slate-200/80 bg-white p-6"
            style={{ "--delay": "200ms" } as React.CSSProperties}
          >
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Version history</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {versions.map((version) => (
                <div key={version.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">v{version.version}</span>
                      {version.is_current && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 size={11} /> Latest
                        </span>
                      )}
                      {version.status === "pending" && (
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Pending review
                        </span>
                      )}
                      <span className="text-xs text-slate-400">{formatDate(version.created_at)}</span>
                    </div>
                    {version.release_notes && (
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{version.release_notes}</p>
                    )}
                  </div>
                  <a
                    href={`/api/download/${app.id}?version=${version.id}`}
                    className="btn-soft inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600"
                  >
                    <Download size={13} /> Download
                  </a>
                </div>
              ))}
            </div>
          </section>

          <ReviewsSection
            appId={app.id}
            reviews={reviews}
            average={average}
            count={reviewCount}
            currentUserId={session?.id}
          />

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
            {app.package_name && (
              <div className="flex items-start gap-3">
                <Package size={16} className="mt-0.5 shrink-0 text-indigo-400" />
                <div className="min-w-0">
                  <dt className="text-xs text-slate-400">Package</dt>
                  <dd className="truncate text-slate-700">{app.package_name}</dd>
                </div>
              </div>
            )}
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
                <dd className="text-slate-700">
                  {app.owner_username ? (
                    <Link href={`/developers/${app.owner_username}`} className="text-indigo-600 hover:text-indigo-700">
                      {app.owner_name}
                    </Link>
                  ) : (
                    app.owner_name
                  )}
                </dd>
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
