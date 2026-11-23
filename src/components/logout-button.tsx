"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      // Clearing every session cookie locally is enough to sign out.
      // No call to the external auth provider — that request can hang.
      await fetch("/api/auth/admin-logout", { method: "POST" });
    } catch {
      // Still reload so the UI reflects the cleared state.
    }
    // Full reload guarantees the server-rendered header updates.
    window.location.replace("/");
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
