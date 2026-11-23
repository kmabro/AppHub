"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImagePlus, Loader2, Plus, UploadCloud, X } from "lucide-react";
import { CATEGORIES, type AppRecord, type InstallMethod, type Platform } from "@/lib/types";

const inputClass =
  "field w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm placeholder:text-slate-400";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

type Initial = Pick<
  AppRecord,
  | "id"
  | "name"
  | "package_name"
  | "description"
  | "category"
  | "platform"
  | "version"
  | "install_method"
  | "file_url"
  | "external_url"
  | "icon_url"
  | "screenshots"
>;

async function uploadFile(file: File, kind: "apk" | "ipa" | "icon" | "screenshot") {
  const res = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, fileName: file.name, size: file.size, contentType: file.type }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not prepare upload");

  const put = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": data.contentType },
    body: file,
  });
  if (!put.ok) throw new Error(`Upload failed (${put.status})`);

  return { url: data.url as string, size: file.size };
}

export function AppForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [packageName, setPackageName] = useState(initial?.package_name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Education");
  const [platform, setPlatform] = useState<Platform>(initial?.platform ?? "android");
  const [version, setVersion] = useState(initial?.version ?? "1.0.0");
  const [installMethod, setInstallMethod] = useState<InstallMethod>(
    initial?.install_method ?? "file"
  );
  const [externalUrl, setExternalUrl] = useState(initial?.external_url ?? "");
  const [iconUrl, setIconUrl] = useState<string | null>(initial?.icon_url ?? null);
  const [screenshots, setScreenshots] = useState<string[]>(initial?.screenshots ?? []);
  const [appFile, setAppFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(initial?.file_url ?? null);
  const [fileSize, setFileSize] = useState(0);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  function onAppFileChange(file: File | null) {
    setAppFile(file);
    setFileSize(file?.size ?? 0);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!name.trim() || !packageName.trim()) {
      setError("App name and package name are required.");
      return;
    }
    if (installMethod === "file" && !appFile && !existingFileUrl) {
      setError("Choose the app file to upload.");
      return;
    }
    if (installMethod === "link" && !externalUrl.trim()) {
      setError("Provide an install link.");
      return;
    }

    setBusy(true);
    try {
      setStatus("Uploading files…");
      const kind = platform === "android" ? "apk" : "ipa";
      let fileUrl = existingFileUrl;

      if (appFile) {
        const uploaded = await uploadFile(appFile, kind);
        fileUrl = uploaded.url;
        setFileSize(uploaded.size);
        setExistingFileUrl(uploaded.url);
      }

      let newIconUrl = iconUrl;
      const iconInput = document.querySelector<HTMLInputElement>("#icon-input")?.files?.[0];
      if (iconInput) {
        const uploaded = await uploadFile(iconInput, "icon");
        newIconUrl = uploaded.url;
        setIconUrl(uploaded.url);
      }

      const shotInput = document.querySelector<HTMLInputElement>("#shot-input")?.files;
      let finalScreenshots = screenshots;
      if (shotInput?.length) {
        const uploaded = await Promise.all(
          Array.from(shotInput).map((file) => uploadFile(file, "screenshot"))
        );
        finalScreenshots = [...screenshots, ...uploaded.map((item) => item.url)].slice(0, 6);
      }

      setStatus("Saving app…");
      const payload = {
        name: name.trim(),
        packageName: packageName.trim(),
        description: description.trim(),
        category,
        platform,
        version: version.trim() || "1.0.0",
        installMethod,
        fileUrl: installMethod === "file" ? fileUrl : null,
        externalUrl: installMethod === "link" ? externalUrl.trim() : null,
        fileSize: installMethod === "file" ? fileSize : 0,
        iconUrl: newIconUrl,
        screenshots: finalScreenshots,
      };

      const res = await fetch(editing ? `/api/apps/${initial!.id}` : "/api/apps", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the app");

      router.push(`/apps/${editing ? initial!.id : data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section
        className="rise-in rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
        style={{ "--delay": "60ms" } as React.CSSProperties}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-bold text-indigo-600">
            01
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">App details</h2>
            <p className="text-sm text-slate-500">Tell everyone what you built.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="app-name">
              App name *
            </label>
            <input
              id="app-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Study Planner"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="package-name">
              Package name *
            </label>
            <input
              id="package-name"
              value={packageName}
              onChange={(event) => setPackageName(event.target.value)}
              placeholder="com.school.studyplanner"
              className={inputClass}
              required
            />
            <p className="mt-1 text-xs text-slate-400">Use the same ID as in your app build.</p>
          </div>
          <div>
            <label className={labelClass} htmlFor="version">
              Version
            </label>
            <input
              id="version"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              placeholder="1.0.0"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="category">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={inputClass}
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="platform">
              Platform
            </label>
            <select
              id="platform"
              value={platform}
              onChange={(event) => {
                setPlatform(event.target.value as Platform);
                onAppFileChange(null);
              }}
              className={inputClass}
            >
              <option value="android">Android</option>
              <option value="ios">iOS</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="What does your app do? What makes it useful?"
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>
      </section>

      <section
        className="rise-in rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
        style={{ "--delay": "140ms" } as React.CSSProperties}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-bold text-indigo-600">
            02
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Install file</h2>
            <p className="text-sm text-slate-500">
              Android users download an APK. For iOS, a TestFlight or App Store link works best.
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2 rounded-lg bg-slate-100 p-1">
          {(["file", "link"] as InstallMethod[]).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setInstallMethod(method)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-300 ${
                installMethod === method
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {method === "file" ? `Upload ${platform === "android" ? "APK" : "IPA"}` : "Use a link"}
            </button>
          ))}
        </div>

        {installMethod === "file" ? (
          <div className="mt-4">
            <label
              htmlFor="app-file"
              className="group flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-inner"
            >
              <UploadCloud
                size={24}
                className="text-indigo-500 transition-transform duration-300 group-hover:-translate-y-1"
              />
              <span className="mt-2 text-sm font-medium text-slate-700">
                {appFile ? appFile.name : existingFileUrl ? "Replace current file" : "Choose a file"}
              </span>
              <span className="mt-1 text-xs text-slate-400">
                {platform === "android" ? ".apk" : ".ipa"} · up to 200 MB
              </span>
              <input
                id="app-file"
                type="file"
                accept={platform === "android" ? ".apk,application/vnd.android.package-archive" : ".ipa"}
                onChange={(event) => onAppFileChange(event.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
            {existingFileUrl && !appFile && (
              <p className="mt-2 text-xs text-slate-500">
                A file is already published. Choose a new one only if you want to replace it.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <label className={labelClass} htmlFor="external-url">
              Install link *
            </label>
            <input
              id="external-url"
              type="url"
              value={externalUrl}
              onChange={(event) => setExternalUrl(event.target.value)}
              placeholder="https://testflight.apple.com/join/…"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-400">
              TestFlight, App Store, Google Play, or your own download page.
            </p>
          </div>
        )}
      </section>

      <section
        className="rise-in rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
        style={{ "--delay": "220ms" } as React.CSSProperties}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-bold text-indigo-600">
            03
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Images</h2>
            <p className="text-sm text-slate-500">Optional, but they help your app stand out.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="icon-input">
              App icon
            </label>
            <label
              htmlFor="icon-input"
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <ImagePlus size={18} className="text-slate-400" />
              {iconUrl ? "Replace icon" : "Choose an image"}
              <input
                id="icon-input"
                type="file"
                accept="image/*"
                className="hidden"
              />
            </label>
            {iconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconUrl} alt="Icon preview" className="mt-2 h-14 w-14 rounded-lg object-cover" />
            )}
          </div>
          <div>
            <label className={labelClass} htmlFor="shot-input">
              Screenshots (up to 6)
            </label>
            <label
              htmlFor="shot-input"
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <Plus size={18} className="text-slate-400" />
              Add screenshots
              <input
                id="shot-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
              />
            </label>
          </div>
        </div>

        {screenshots.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {screenshots.map((url, index) => (
              <div key={url + index} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setScreenshots(screenshots.filter((_, i) => i !== index))}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-slate-900 p-1 text-white"
                  aria-label="Remove screenshot"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && (
        <p
          role="alert"
          className="fade-in rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {status && (
        <p className="fade-in flex items-center gap-2 text-sm text-indigo-600">
          <Loader2 size={14} className="spin-slow" />
          {status}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="btn-primary group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
        >
          {busy && <Loader2 size={16} className="spin-slow" />}
          {busy ? "Working…" : editing ? "Save changes" : "Publish app"}
        </button>
        <Link
          href={editing ? `/apps/${initial!.id}` : "/"}
          className="btn-soft rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600"
        >
          Cancel
        </Link>
        <p className="text-xs text-slate-400">
          {editing ? "Changes appear immediately." : "Your app goes live as soon as you publish."}
        </p>
      </div>
    </form>
  );
}
