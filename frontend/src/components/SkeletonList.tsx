export function SkeletonList({ plain = false }: { plain?: boolean }) {
  const list = (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.03] p-3.5">
          <div className="h-8 w-8 shrink-0 rounded-full bg-white/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-white/10" />
            <div className="h-3 w-1/4 rounded bg-white/10" />
          </div>
          <div className="hidden sm:flex gap-2">
            <div className="h-8 w-8 rounded-lg bg-white/5" />
            <div className="h-8 w-8 rounded-lg bg-white/5" />
            <div className="h-8 w-8 rounded-lg bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );

  if (plain) {
    return <div className="animate-pulse">{list}</div>;
  }

  return (
    <div className="card animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 rounded bg-white/10" />
        <div className="h-7 w-16 rounded-xl bg-white/5" />
      </div>

      {/* Quick Add Form placeholder */}
      <div className="grid gap-3 xl:grid-cols-[1fr_180px_140px_150px_auto]">
        <div className="h-10 rounded-xl bg-white/10" />
        <div className="h-10 rounded-xl bg-white/10" />
        <div className="h-10 rounded-xl bg-white/10" />
        <div className="h-10 rounded-xl bg-white/10" />
        <div className="h-10 w-10 rounded-xl bg-white/10" />
      </div>

      {/* Filters placeholder */}
      <div className="grid gap-3 lg:grid-cols-[1fr_160px_150px_150px]">
        <div className="h-10 rounded-xl bg-white/10" />
        <div className="h-10 rounded-xl bg-white/10" />
        <div className="h-10 rounded-xl bg-white/10" />
        <div className="h-10 rounded-xl bg-white/10" />
      </div>

      {list}
    </div>
  );
}