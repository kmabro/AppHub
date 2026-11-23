"use client";

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function UploadProgress({ progress, label }: { progress: number; label: string }) {
  return (
    <div className="fade-in flex flex-col items-start gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:flex-row sm:items-center">
      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
          <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="#e0e7ff" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={RADIUS}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - Math.min(100, Math.max(0, progress)) / 100)}
            className="transition-[stroke-dashoffset] duration-200 ease-out"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-indigo-700">
          {progress}%
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Uploading your files. Keep this page open until it reaches 100%.
        </p>
      </div>
    </div>
  );
}
