import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>AppHub — apps built and shared by students.</p>
        <div className="flex gap-4">
          <Link href="/" className="hover:text-slate-900">
            Explore
          </Link>
          <Link href="/dashboard" className="hover:text-slate-900">
            My apps
          </Link>
        </div>
      </div>
    </footer>
  );
}
