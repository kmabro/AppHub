import { Apple, Smartphone } from "lucide-react";
import type { Platform } from "@/lib/types";

export function PlatformBadge({ platform }: { platform: Platform }) {
  const isAndroid = platform === "android";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
        isAndroid ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
      }`}
    >
      {isAndroid ? <Smartphone size={12} /> : <Apple size={12} />}
      {isAndroid ? "Android" : "iOS"}
    </span>
  );
}
