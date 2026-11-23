"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { createStudentProfile } from "@/app/actions/auth";

type Props = {
  mode: "login" | "register";
  notice?: string;
  title?: string;
  description?: string;
  redirectTo?: string;
  admin?: boolean;
};

const notices: Record<string, string> = {
  registered: "Account created. Enter the verification code we emailed you.",
  verified: "Email verified. You can sign in now.",
  reset: "Password updated. Sign in with your new password.",
};

async function post(path: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, callbackURL: window.location.origin }),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
}

export function AuthForm({ mode, notice, title, description, redirectTo, admin }: Props) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const access = await fetch("/api/auth/check-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
        .then((response) => response.json())
        .catch(() => ({ status: "active" }));

      if (access.status === "deleted") {
        throw new Error("This email was removed by an administrator. Contact the admin for access.");
      }
      if (isRegister) {
        const result = await post("sign-up/email", { name, email, password });
        if (!result.ok) throw new Error(result.data?.message || "Could not create account");
        const user = result.data?.user;
        if (user?.id) await createStudentProfile(user.id, name, email);
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      if (admin) {
        const response = await fetch("/api/auth/admin-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: email, password }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Incorrect administrator credentials");
        router.push(redirectTo || "/admin");
        router.refresh();
        return;
      }

      if (access.status === "blocked") {
        throw new Error("Your account has been blocked by an administrator.");
      }
      if (access.status === "missing") {
        throw new Error("No account found with this email. Create one first.");
      }
      if (access.status === "unverified") {
        throw new Error("Please verify your email first — check your inbox for the 6-digit code.");
      }

      const result = await post("sign-in/email", { email, password });
      if (!result.ok) {
        const message = String(result.data?.message ?? "");
        if (/verif/i.test(message)) {
          throw new Error("Please verify your email first — check your inbox for the 6-digit code.");
        }
        throw new Error("Incorrect email or password");
      }
      router.push(redirectTo || "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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

      <div
        className="rise-in overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(79,70,229,0.45)] sm:p-8"
        style={{ "--delay": "80ms" } as React.CSSProperties}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title || (isRegister ? "Create your account" : "Welcome back")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {description ||
            (isRegister
              ? "Join AppHub to publish apps and install the ones your classmates shared."
              : "Sign in to manage the apps you have published.")}
        </p>

        {notice && notices[notice] && (
          <p
            role="status"
            className="fade-in mt-4 rounded-xl border border-indigo-100 bg-indigo-50 px-3.5 py-2.5 text-sm text-indigo-700"
          >
            {notices[notice]}
          </p>
        )}

        <form onSubmit={submit} className="mt-7 space-y-4">
          {isRegister && (
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
                className="field w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-base sm:text-sm"
              />
            </div>
          )}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                {isRegister ? "Email address" : admin ? "Admin username" : "Email address"}
              </label>
              {!isRegister && !admin && (
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-indigo-600 transition hover:text-indigo-700"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <input
              id="email"
              type="text"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete={admin ? "username" : "email"}
              required
              className="field w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-base sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={isRegister ? 8 : 1}
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
            {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
            {!busy && <ArrowRight size={16} className="arrow-slide" />}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          {isRegister ? "Already have an account? " : "New to AppHub? "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="group inline-flex items-center gap-1 font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
          >
            {isRegister ? "Sign in" : "Create one"}
            <ArrowRight size={13} className="arrow-slide" />
          </Link>
        </p>
        {!isRegister && !admin && (
          <p className="mt-3 text-center text-xs text-slate-400">
            Didn&apos;t get the verification code?{" "}
            <Link
              href="/resend-verification"
              className="font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              Send it again
            </Link>
          </p>
        )}
        {admin && (
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={14} /> Restricted administrator access
          </p>
        )}
      </div>
    </div>
  );
}
