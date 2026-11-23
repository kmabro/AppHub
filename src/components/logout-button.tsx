"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => {});
      await fetch("/api/auth/admin-logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      title="Sign out"
      aria-label="Sign out"
      className="nav-link inline-flex items-center gap-1.5 rounded-lg p-1.5 text-sm text-slate-500 hover:text-slate-900 disabled:opacity-50 sm:p-0"
    >
      <LogOut size={16} className="sm:hidden" />
      <span className="hidden sm:inline">{busy ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}
