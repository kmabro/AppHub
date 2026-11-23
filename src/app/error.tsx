"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <AlertTriangle size={24} />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        We couldn&apos;t load this page. Try again — if the problem continues, please contact the
        developer.
      </p>
      <button
        type="button"
        onClick={reset}
        className="btn-primary mt-6 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
