"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password, callbackURL: window.location.origin }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not reset password");
      setDone(true);
      window.setTimeout(() => router.push("/login?reset=1"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="rise-in rounded-3xl border border-slate-200/80 bg-white p-6 text-center sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Invalid link</h1>
        <p className="mt-2 text-sm text-slate-500">
          This reset link is missing its token. Request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="btn-primary mt-6 inline-flex rounded-lg px-4 py-2.5 text-sm font-medium text-white"
        >
          Request a new link
        </Link>
      </div>
    );
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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Choose a new password</h1>
        <p className="mt-2 text-sm text-slate-500">Use at least 8 characters.</p>

        {done ? (
          <p className="fade-in mt-6 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <Check size={16} /> Password updated. Taking you to sign in…
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="field w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 pr-11 text-base sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
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
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
