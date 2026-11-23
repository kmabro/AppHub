export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="flex w-full flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="font-medium text-slate-700">AppHub</p>
        <p className="leading-relaxed">
          A place for students to publish the apps they build and install the ones their classmates
          shared.
        </p>
      </div>
    </footer>
  );
}
