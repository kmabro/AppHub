/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import type { AppRecord } from "@/lib/types";
import { formatBytes, initials } from "@/lib/format";
import { PlatformBadge } from "./platform-badge";

export function AppCard({ app, index = 0 }: { app: AppRecord; index?: number }) {
  return (
    <Link
      href={`/apps/${app.id}`}
      style={{ "--delay": `${Math.min(index, 12) * 55}ms` } as React.CSSProperties}
      className="group card-lift rise-in relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5"
    >
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-start gap-3.5">
        {app.icon_url ? (
          <img
            src={app.icon_url}
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
          />
        ) : (
          <div className="icon-bubble flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 text-sm font-semibold text-indigo-600">
            {initials(app.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold text-slate-900 transition-colors duration-300 group-hover:text-indigo-700">
              {app.name}
            </h3>
            <ArrowUpRight
              size={16}
              className="shrink-0 text-slate-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-500"
            />
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {app.category} · v{app.version}
          </p>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-slate-600">
        {app.description || "No description provided."}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={app.platform} />
          <span className="text-xs text-slate-400">{formatBytes(Number(app.file_size))}</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500 transition-colors duration-300 group-hover:bg-indigo-50 group-hover:text-indigo-600">
          <Download size={13} />
          {app.downloads}
        </span>
      </div>
    </Link>
  );
}
