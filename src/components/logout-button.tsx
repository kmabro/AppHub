"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/admin-logout", {
        method: "POST",
        cache: "no-store",
      });
    } catch {
      // Still reload even if the request reports an error.
    }
    const separator = window.location.href.includes("?") ? "&" : "?";
    window.location.replace(`/${separator}signedout=1&t=${Date.now()}`);
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      title="Sign out"
      aria-label="Sign out"
      className="nav-link inline-flex items-center gap-1.5 rounded-lg p-1.5 text-sm text-slate-500 transition hover:text-slate-900 disabled:opacity-50"
    >
      <LogOut size={16} className="sm:hidden" />
      <span className="hidden sm:inline">{busy ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}
