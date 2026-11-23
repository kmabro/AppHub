"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  endpoint: string;
  action: string;
  label: string;
  method?: "POST" | "PATCH";
  confirmText?: string;
  danger?: boolean;
};

export function AdminActionButton({
  endpoint,
  action,
  label,
  method = "PATCH",
  confirmText,
  danger,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (response.ok) router.refresh();
    else {
      window.alert("That action could not be completed.");
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className={`btn-soft rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-slate-200 text-slate-600"
      }`}
    >
      {busy ? "…" : label}
    </button>
  );
}
