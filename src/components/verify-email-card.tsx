"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, MailCheck } from "lucide-react";

export function VerifyEmailCard() {
  const router = useRouter();
  const email = useSearchParams().get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/email-otp/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, callbackURL: window.location.origin }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "That code is invalid or has expired");
      router.push("/login?verified=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify");
      setBusy(false);
    }
  }

  if (!email) {
    return (
      <div className="rise-in rounded-3xl border border-slate-200/80 bg-white p-6 text-center sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">No email provided</h1>
        <p className="mt-2 text-sm text-slate-500">
          Open the verification page from the email we sent, or request a new code.
        </p>
        <Link
          href="/resend-verification"
          className="btn-primary mt-6 inline-flex rounded-xl px-4 py-2.5 text-sm font-medium text-white"
        >
          Request a code
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-4 sm:py-8">
      <div className="rise-in mb-6 flex justify-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
          <MailCheck size={22} />
        </span>
      </div>
      <div className="rise-in rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(79,70,229,0.45)] sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Verify your email</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          We sent a 6-digit verification code to <strong className="text-slate-700">{email}</strong>.
          Enter it below to activate your account.
        </p>

        <form onSubmit={verify} className="mt-6 space-y-4">
          <div>
            <label htmlFor="otp" className="mb-1.5 block text-sm font-medium text-slate-700">
              Verification code
            </label>
            <input
              id="otp"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              className="field w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-center text-2xl tracking-[0.4em]"
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
            className="btn-primary group flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
          >
            {busy ? "Checking…" : "Verify account"}
            {!busy && <ArrowRight size={16} className="arrow-slide" />}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-400">
          Didn&apos;t get the code?{" "}
          <Link href="/resend-verification" className="font-medium text-indigo-600 hover:text-indigo-700">
            Send it again
          </Link>
        </p>
      </div>
    </div>
  );
}
