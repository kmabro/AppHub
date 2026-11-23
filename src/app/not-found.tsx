import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="text-sm font-medium text-indigo-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">
        That app or page doesn&apos;t exist — it may have been removed.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Browse apps
      </Link>
    </div>
  );
}
