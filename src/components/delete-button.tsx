"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteButton({
  id,
  name,
  redirectTo,
}: {
  id: string;
  name: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/apps/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
      router.refresh();
    } else {
      window.alert("Could not delete this app. Please try again.");
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      className="btn-soft group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
    >
      <Trash2 size={14} />
      Delete
    </button>
  );
}
