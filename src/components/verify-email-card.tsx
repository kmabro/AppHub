"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, MailCheck } from "lucide-react";

export function VerifyEmailCard() {
  const token = useSearchParams().get("token") ?? "";

  if (!token) {
    return (
      <div className="rise-in rounded-3xl border border-slate-200/80 bg-white p-6 text-center sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">No verification link</h1>
        <p className="mt-2 text-sm text-slate-500">
          This page needs a verification token. Ask an administrator to verify your account.
        </p>
        <Link
          href="/login"
          className="btn-primary mt-6 inline-flex rounded-xl px-4 py-2.5 text-sm font-medium text-white"
        >
          Back to sign in
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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Verify your account</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Your account is created. If the verification email didn&apos;t arrive, you can finish
          verification right here — no waiting and no admin approval needed.
        </p>

        <a
          href={`/api/auth/verify?token=${encodeURIComponent(token)}`}
          className="btn-primary group mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
        >
          <CheckCircle2 size={17} />
          Verify my account
          <ArrowRight size={16} className="arrow-slide" />
        </a>

        <p className="mt-4 text-center text-xs text-slate-400">
          After verifying, you&apos;ll be taken to the sign-in page.
        </p>
        <div className="mt-6 border-t border-slate-100 pt-5 text-center">
          <Link href="/login" className="text-sm text-slate-500 transition hover:text-slate-900">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
