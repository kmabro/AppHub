"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

const inputClass =
  "field w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-base sm:text-sm";

type Props = {
  name: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
};

export function ProfileForm({ name, username, bio, avatarUrl }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(name);
  const [handle, setHandle] = useState(username);
  const [about, setAbout] = useState(bio);
  const [avatar, setAvatar] = useState<string | null>(avatarUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          username: handle,
          bio: about,
          avatarUrl: avatar,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save profile");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(file: File) {
    try {
      const info = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "avatar",
          fileName: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });
      const data = await info.json();
      if (!info.ok) throw new Error(data.error || "Could not prepare upload");
      const put = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": data.contentType },
        body: file,
      });
      if (!put.ok) throw new Error("Upload failed");
      setAvatar(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rise-in rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Public profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          This is what classmates see on your developer profile.
        </p>

        <div className="mt-5 flex items-center gap-4">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="Profile" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-semibold text-indigo-600">
              {fullName.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div>
            <label htmlFor="avatar-input" className="btn-soft inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
              <ImagePlus size={15} /> Choose picture
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadAvatar(file);
                  event.target.value = "";
                }}
              />
            </label>
            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar(null)}
                className="ml-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600"
              >
                <X size={12} /> Remove
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input id="profile-name" value={fullName} onChange={(event) => setFullName(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="profile-username" className="mb-1.5 block text-sm font-medium text-slate-700">
              Username
            </label>
            <input id="profile-username" value={handle} onChange={(event) => setHandle(event.target.value.toLowerCase())} className={inputClass} />
            <p className="mt-1 text-xs text-slate-400">Your profile: /developers/{handle || "username"}</p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="profile-bio" className="mb-1.5 block text-sm font-medium text-slate-700">
              Bio
            </label>
            <textarea id="profile-bio" value={about} onChange={(event) => setAbout(event.target.value)} rows={3} maxLength={300} className={`${inputClass} resize-y`} />
          </div>
        </div>
      </section>

      {error && (
        <p role="alert" className="fade-in rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p className="fade-in rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Profile saved.
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
      >
        {busy && <Loader2 size={16} className="spin-slow" />}
        Save profile
      </button>

    </div>
  );
}
