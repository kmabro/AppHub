"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, ExternalLink, Info, QrCode } from "lucide-react";
import type { InstallMethod, Platform } from "@/lib/types";

type Props = {
  id: string;
  platform: Platform;
  installMethod: InstallMethod;
  fileName?: string | null;
};

export function InstallButton({ id, platform, installMethod, fileName }: Props) {
  const [qr, setQr] = useState("");
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
      color: { dark: "#312e81", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => {});
  }, [href]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={href}
          className="btn-primary group inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white"
        >
          {installMethod === "link" ? (
            <ExternalLink size={17} className="arrow-slide" />
          ) : (
            <Download size={17} className="transition-transform duration-300 group-hover:translate-y-0.5" />
          )}
          {label}
        </a>
        <button
          type="button"
          onClick={() => setShowQr((value) => !value)}
          className="btn-soft group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-700"
        >
          <QrCode
            size={17}
            className={`transition-transform duration-500 ${showQr ? "rotate-180 text-indigo-600" : "group-hover:rotate-12"}`}
          />
          QR code
        </button>
      </div>

      {showQr && (
        <div className="rise-in mt-4 w-fit rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-lg shadow-indigo-500/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code to install this app" className="h-44 w-44 rounded-lg" />
          <p className="mt-3 max-w-44 text-xs leading-relaxed text-slate-500">
            Scan with your phone to open the install link
          </p>
        </div>
      )}

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <Info size={14} className="mt-0.5 shrink-0 text-slate-400" />
        <span>
          {platform === "android" && installMethod === "file"
            ? ` Downloads a ${fileName || "file"} — your phone may ask permission to install apps from unknown sources.`
            : platform === "ios" && installMethod === "file"
              ? " iOS apps normally need Apple signing or TestFlight to install. Ask the developer for instructions."
              : " Opens the developer's distribution page in a new step."}
        </span>
      </p>
    </div>
  );
}
