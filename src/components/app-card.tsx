/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Download } from "lucide-react";
import type { AppRecord } from "@/lib/types";
import { formatBytes, initials } from "@/lib/format";
import { PlatformBadge } from "./platform-badge";

export function AppCard({ app }: { app: AppRecord }) {
  return (
    <Link
      href={`/apps/${app.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/60"
    >
      <div className="flex items-start gap-3.5">
        {app.icon_url ? (
          <img
            src={app.icon_url}
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-semibold text-indigo-600">
            {initials(app.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900 group-hover:text-indigo-700">
            {app.name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-slate-500">{app.category} · v{app.version}</p>
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
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <Download size={13} />
          {app.downloads}
        </span>
      </div>
    </Link>
  );
}
