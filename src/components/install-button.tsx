"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, ExternalLink, QrCode } from "lucide-react";
import type { InstallMethod, Platform } from "@/lib/types";

type Props = {
  id: string;
  platform: Platform;
  installMethod: InstallMethod;
  fileName?: string | null;
};

export function InstallButton({ id, platform, installMethod, fileName }: Props) {
  const [qr, setQr] = useState<string>("");
  const [showQr, setShowQr] = useState(false);

  const href = `/api/download/${id}`;
  const label =
    installMethod === "link"
      ? platform === "ios"
        ? "Get on TestFlight / App Store"
        : "Open install page"
      : platform === "ios"
        ? "Download .ipa file"
        : "Download APK";

  useEffect(() => {
    if (typeof window === "undefined") return;
    QRCode.toDataURL(`${window.location.origin}${href}`, {
      width: 220,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => {});
  }, [href]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={href}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          {installMethod === "link" ? <ExternalLink size={16} /> : <Download size={16} />}
          {label}
        </a>
        <button
          type="button"
          onClick={() => setShowQr((value) => !value)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <QrCode size={16} />
          QR code
        </button>
      </div>

      {showQr && (
        <div className="mt-3 w-fit rounded-xl border border-slate-200 bg-white p-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code to install this app" className="h-44 w-44" />
          <p className="mt-2 max-w-44 text-xs text-slate-500">
            Scan with your phone to open the install link
          </p>
        </div>
      )}

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        {platform === "android" && installMethod === "file"
          ? ` Downloads a ${fileName || "file"} — your phone may ask permission to install apps from unknown sources.`
          : platform === "ios" && installMethod === "file"
            ? " iOS apps normally need Apple signing or TestFlight to install. Ask the developer for instructions."
            : " Opens the developer's distribution page in a new step."}
      </p>
    </div>
  );
}
