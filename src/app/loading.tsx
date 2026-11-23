export default function Loading() {
  return (
    <div className="space-y-6" aria-label="Loading">
      <div className="shimmer relative h-64 overflow-hidden rounded-3xl border border-slate-200 bg-white" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="shimmer relative h-20 overflow-hidden rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="shimmer relative h-44 overflow-hidden rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>
    </div>
  );
}
