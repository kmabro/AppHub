"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Download, ExternalLink, Info, QrCode } from "lucide-react";
import type { InstallMethod, Platform } from "@/lib/types";

type Props = {
  id: string;
  platform: Platform;
  installMethod: InstallMethod;
  fileName?: string | null;
};

function installUrlFor(href: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${configured || origin}${href}`;
}

export function InstallButton({ id, platform, installMethod, fileName }: Props) {
  const [qr, setQr] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

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
    QRCode.toDataURL(installUrlFor(href), {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#1e1b4b", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => {});
  }, [href]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(installUrlFor(href));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={href}
          className="btn-primary group inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white sm:w-auto sm:px-6"
        >
          {installMethod === "link" ? (
            <ExternalLink size={17} className="arrow-slide" />
          ) : (
            <Download
              size={17}
              className="transition-transform duration-300 group-hover:translate-y-0.5"
            />
          )}
          {label}
        </a>
        <button
          type="button"
          onClick={() => setShowQr((value) => !value)}
          className="btn-soft group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-700 sm:w-auto"
        >
          <QrCode
            size={17}
            className={`transition-transform duration-500 ${showQr ? "rotate-180 text-indigo-600" : "group-hover:rotate-12"}`}
          />
          QR code
        </button>
      </div>

      {showQr && (
        <div className="rise-in mt-4 w-fit max-w-full rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-lg shadow-indigo-500/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt="QR code to install this app"
            className="mx-auto h-48 w-48 rounded-lg sm:h-56 sm:w-56"
          />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Scan with your phone camera
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Opens the install link on your phone, then downloads the app.
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="btn-soft inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <a
              href={href}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
            >
              <ExternalLink size={13} /> Open link
            </a>
          </div>
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
