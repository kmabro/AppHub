import Link from "next/link";
import { LayoutGrid, Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { initials } from "@/lib/format";
import { LogoutButton } from "./logout-button";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <LayoutGrid size={17} strokeWidth={2.3} />
          </span>
          <span className="text-lg">AppHub</span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5">
          <Link href="/" className="text-sm text-slate-600 transition hover:text-slate-900">
            Explore
          </Link>
          {session ? (
            <>
              <Link
                href="/apps/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Publish app</span>
              </Link>
              <Link
                href="/dashboard"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 transition hover:bg-slate-300"
                title={session.name}
              >
                {initials(session.name) || session.email[0]?.toUpperCase()}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-slate-600 transition hover:text-slate-900">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
