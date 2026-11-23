export function SiteFooter() {
  return (
    <footer className="relative border-t border-slate-200/70 bg-white/70 backdrop-blur">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />
      <div className="fade-in flex w-full flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 lg:px-8">
        <p className="font-semibold text-slate-700">AppHub</p>
        <p className="leading-relaxed">
          Find and install apps built by your classmates — and share the one you built.
        </p>
        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/70 px-3 py-1.5 text-xs font-medium text-indigo-600">
          <span className="breathe h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Developed by <span className="font-semibold">@kmabro</span>
        </p>
      </div>
    </footer>
  );
}
