import Link from "next/link";
import { LayoutGrid, Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { initials } from "@/lib/format";
import { LogoutButton } from "./logout-button";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
            <LayoutGrid size={18} strokeWidth={2.3} />
          </span>
          <span className="text-lg transition-colors duration-300 group-hover:text-indigo-700">
            AppHub
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="nav-link text-sm text-slate-600 hover:text-slate-900">
            Explore
          </Link>
          {session ? (
            <>
              <Link
                href="/apps/new"
                className="btn-primary group inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white sm:px-4"
              >
                <Plus
                  size={15}
                  className="transition-transform duration-300 group-hover:rotate-90"
                />
                <span className="hidden sm:inline">Publish app</span>
              </Link>
              <Link
                href="/dashboard"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:scale-110 hover:from-indigo-100 hover:to-violet-100 hover:text-indigo-700"
                title={session.name}
              >
                {initials(session.name) || session.email[0]?.toUpperCase()}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link text-sm text-slate-600 hover:text-slate-900">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary rounded-lg px-3 py-2 text-sm font-medium text-white sm:px-4">
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
