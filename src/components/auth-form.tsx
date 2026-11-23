"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LayoutGrid, Loader2, ShieldCheck } from "lucide-react";

type Props = { mode: "login" | "register" };

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isRegister ? { name, email, password } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-4 sm:py-8">
      <div className="rise-in mb-6 flex justify-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
          <LayoutGrid size={22} />
        </span>
      </div>

      <div
        className="rise-in overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(79,70,229,0.45)] sm:p-8"
        style={{ "--delay": "80ms" } as React.CSSProperties}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {isRegister
            ? "Join AppHub to publish apps and install the ones your classmates shared."
            : "Sign in to manage the apps you have published."}
        </p>

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
                placeholder="e.g. Ayesha Khan"
                autoComplete="name"
                required
                className="field w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm placeholder:text-slate-400"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@school.edu"
              autoComplete="email"
              required
              className="field w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm placeholder:text-slate-400"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isRegister ? "At least 8 characters" : "Your password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={isRegister ? 8 : 1}
              required
              className="field w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm placeholder:text-slate-400"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="fade-in rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary group flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
          >
            {busy ? (
              <>
                <Loader2 size={16} className="spin-slow" /> Please wait…
              </>
            ) : (
              <>
                {isRegister ? "Create account" : "Sign in"}
                <ArrowRight size={16} className="arrow-slide" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-100" />
          <span className="text-xs text-slate-400">or</span>
          <span className="h-px flex-1 bg-slate-100" />
        </div>

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
      </div>

      <p
        className="fade-in mt-5 flex items-center justify-center gap-2 text-xs text-slate-400"
        style={{ "--delay": "200ms" } as React.CSSProperties}
      >
        <ShieldCheck size={14} />
        Your password is stored securely. Only you can manage your apps.
      </p>
    </div>
  );
}
