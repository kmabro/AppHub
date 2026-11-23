"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImagePlus, Loader2, Plus, UploadCloud, X } from "lucide-react";
import { CATEGORIES, type AppRecord, type InstallMethod, type Platform } from "@/lib/types";
import { UploadProgress } from "./upload-progress";
import { ImageCropper } from "./image-cropper";

const inputClass =
  "field w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-base sm:text-sm";

type Initial = Pick<
  AppRecord,
  | "id"
  | "name"
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

function uploadFile(
  file: File,
  kind: "apk" | "ipa" | "icon" | "screenshot",
  onProgress: (percent: number) => void
): Promise<{ url: string; size: number }> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, fileName: file.name, size: file.size, contentType: file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not prepare upload");

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", data.uploadUrl);
      xhr.setRequestHeader("Content-Type", data.contentType);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve({ url: data.url as string, size: file.size });
        } else {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
      xhr.send(file);
    } catch (error) {
      reject(error);
    }
  });
}

export function AppForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [releaseNotes, setReleaseNotes] = useState("");
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
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState("");

  const [cropTarget, setCropTarget] = useState<{
    file: File;
    url: string;
    kind: "icon" | "screenshot";
  } | null>(null);
  const [shotQueue, setShotQueue] = useState<File[]>([]);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [shotFiles, setShotFiles] = useState<File[]>([]);
  const [newIconUrl, setNewIconUrl] = useState<string | null>(null);
  const [newShotUrls, setNewShotUrls] = useState<string[]>([]);

  function openCrop(file: File, kind: "icon" | "screenshot") {
    setCropTarget({ file, url: URL.createObjectURL(file), kind });
  }

  function handleCropDone(file: File) {
    if (!cropTarget) return;
    if (cropTarget.kind === "icon") {
      setIconFile(file);
      setNewIconUrl(URL.createObjectURL(file));
      setIconUrl(null);
    } else {
      setShotFiles((previous) => [...previous, file]);
      setNewShotUrls((previous) => [...previous, URL.createObjectURL(file)]);
    }
    URL.revokeObjectURL(cropTarget.url);
    setCropTarget(null);

    if (cropTarget.kind === "screenshot" && shotQueue.length > 1) {
      const [next, ...rest] = shotQueue;
      setShotQueue(rest);
      setCropTarget({ file: next, url: URL.createObjectURL(next), kind: "screenshot" });
    } else {
      setShotQueue([]);
    }
  }

  function cancelCrop() {
    if (cropTarget) URL.revokeObjectURL(cropTarget.url);
    setCropTarget(null);
    setShotQueue([]);
  }

  function onAppFileChange(file: File | null) {
    setAppFile(file);
    setFileSize(file?.size ?? 0);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("App name is required.");
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
    setError("");
    setProgress({});
    setPhase("Uploading files…");
    try {
      const kind = platform === "android" ? "apk" : "ipa";
      let fileUrl = existingFileUrl;

      const track = (key: string) => (percent: number) =>
        setProgress((previous) => ({ ...previous, [key]: percent }));

      if (appFile) {
        const uploaded = await uploadFile(appFile, kind, track("app"));
        fileUrl = uploaded.url;
        setFileSize(uploaded.size);
        setExistingFileUrl(uploaded.url);
      }

      let savedIconUrl = iconUrl;
      if (iconFile) {
        const uploaded = await uploadFile(iconFile, "icon", track("icon"));
        savedIconUrl = uploaded.url;
        setIconUrl(uploaded.url);
      }

      let finalScreenshots = screenshots;
      if (shotFiles.length) {
        const uploaded = await Promise.all(
          shotFiles.map((file, index) => uploadFile(file, "screenshot", track(`shot-${index}`)))
        );
        finalScreenshots = [...screenshots, ...uploaded.map((item) => item.url)].slice(0, 6);
      }

      setPhase("Saving app…");
      setStatus("Saving app…");
      const payload = {
        name: name.trim(),
        description: description.trim(),
        category,
        platform,
        version: version.trim() || "1.0.0",
        releaseNotes: releaseNotes.trim(),
        installMethod,
        fileUrl: installMethod === "file" ? fileUrl : null,
        externalUrl: installMethod === "link" ? externalUrl.trim() : null,
        fileSize: installMethod === "file" ? fileSize : 0,
        iconUrl: savedIconUrl,
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
      setPhase("");
    } finally {
      setBusy(false);
      setPhase("");
    }
  }

  const progressValues = Object.values(progress);
  const overallProgress = progressValues.length
    ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
    : 100;
  const shownIcon = newIconUrl ?? iconUrl;
  const allShots = [...screenshots, ...newShotUrls];

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="rise-in rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">App details</h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="app-name">
              App name *
            </label>
            <input
              id="app-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="category">
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
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="platform">
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
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={2000}
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="version">
              Version
            </label>
            <input
              id="version"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Start at 1.0.0 and bump it whenever you upload a new file.
            </p>
          </div>
        </div>
      </section>

      <section
        className="rise-in rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
        style={{ "--delay": "80ms" } as React.CSSProperties}
      >
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Install file</h2>

        <div className="mt-4 flex gap-2 rounded-lg bg-slate-100 p-1">
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
          <label
            htmlFor="app-file"
            className="group mt-4 flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50/50"
          >
            <UploadCloud
              size={24}
              className="text-indigo-500 transition-transform duration-300 group-hover:-translate-y-1"
            />
            <span className="mt-2 text-sm font-medium text-slate-700">
              {appFile ? appFile.name : existingFileUrl ? "Replace current file" : "Choose a file"}
            </span>
            <span className="mt-1 text-xs text-slate-400">
              .{platform === "android" ? "apk" : "ipa"} · up to 200 MB
            </span>
            <input
              id="app-file"
              type="file"
              accept={platform === "android" ? ".apk,application/vnd.android.package-archive" : ".ipa"}
              onChange={(event) => onAppFileChange(event.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
        ) : (
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="external-url">
              Install link
            </label>
            <input
              id="external-url"
              type="url"
              value={externalUrl}
              onChange={(event) => setExternalUrl(event.target.value)}
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Google Drive, TestFlight, App Store, or any download page.
            </p>
          </div>
        )}

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="release-notes">
            Release notes
          </label>
          <textarea
            id="release-notes"
            value={releaseNotes}
            onChange={(event) => setReleaseNotes(event.target.value)}
            rows={2}
            maxLength={1000}
            className={`${inputClass} resize-y`}
          />
          <p className="mt-1.5 text-xs text-slate-400">
            {editing
              ? "Describe what changed in this version. New releases are reviewed before going live."
              : "Optional — tell people what this first release includes."}
          </p>
        </div>
      </section>

      <section
        className="rise-in rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
        style={{ "--delay": "160ms" } as React.CSSProperties}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Images</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            Optional
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="icon-input">
              App icon
            </label>
            <label
              htmlFor="icon-input"
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-600 transition-all duration-300 hover:bg-slate-50"
            >
              <ImagePlus size={18} className="text-slate-400" />
              Choose an image
              <input
                id="icon-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) openCrop(file, "icon");
                  event.target.value = "";
                }}
              />
            </label>
            {shownIcon && (
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shownIcon} alt="Icon preview" className="h-14 w-14 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setIconUrl(null);
                    setIconFile(null);
                    setNewIconUrl(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-red-600"
                >
                  <X size={12} /> Remove icon
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="shot-input">
              Screenshots (up to 6)
            </label>
            <label
              htmlFor="shot-input"
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-600 transition-all duration-300 hover:bg-slate-50"
            >
              <Plus size={18} className="text-slate-400" />
              Add screenshots
              <input
                id="shot-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (files.length) {
                    const [first, ...rest] = files;
                    setShotQueue(rest);
                    openCrop(first, "screenshot");
                  }
                  event.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {allShots.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {allShots.map((url, index) => (
              <div key={url + index} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    if (index < screenshots.length) {
                      setScreenshots(screenshots.filter((_, i) => i !== index));
                    } else {
                      const position = index - screenshots.length;
                      setShotFiles((previous) => previous.filter((_, i) => i !== position));
                      setNewShotUrls((previous) => previous.filter((_, i) => i !== position));
                    }
                  }}
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

      {phase && <UploadProgress progress={overallProgress} label={phase} />}

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
      </div>

      {cropTarget && (
        <ImageCropper
          src={cropTarget.url}
          fileName={cropTarget.file.name}
          mime={cropTarget.file.type || "image/jpeg"}
          aspect={cropTarget.kind === "icon" ? 1 : undefined}
          onDone={handleCropDone}
          onCancel={cancelCrop}
        />
      )}
    </form>
  );
}
