"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";

type Props = {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  endpoint: string;
};

export function EmailActionForm({
  title,
  description,
  submitLabel,
  successMessage,
  endpoint,
}: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send email");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-4 sm:py-8">
      <div className="rise-in mb-6 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/apphub-icon.png"
          alt="AppHub"
          className="h-12 w-12 rounded-2xl object-cover shadow-lg shadow-indigo-500/30"
        />
      </div>
      <div className="rise-in rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(79,70,229,0.45)] sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>

        {sent ? (
          <div className="fade-in mt-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            <p className="flex items-center gap-2 font-medium">
              <Check size={16} /> {successMessage}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-emerald-700">
              Check your inbox and spam folder. If you don&apos;t see it, check the address and try
              again.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="field w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-base sm:text-sm"
              />
            </div>
            {error && (
              <p role="alert" className="fade-in rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
            >
              {busy && <Loader2 size={16} className="spin-slow" />}
              {submitLabel}
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={15} /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
