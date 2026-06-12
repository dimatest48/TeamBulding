export function SkeletonDashboard() {
  const taskRowSkeleton = (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.03] p-3">
      <div className="h-7 w-7 shrink-0 rounded-full bg-white/10" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-1/3 rounded bg-white/10" />
        <div className="h-3 w-1/4 rounded bg-white/10" />
      </div>
    </div>
  );

  return (
    <div className="animate-pulse space-y-6">
      {/* Top Grid */}
      <div className="grid items-stretch gap-6 lg:grid-cols-3">
        {/* Active Tasks Panel Skeleton */}
        <div className="lg:col-span-2 card flex flex-col h-full space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="h-8 w-40 rounded bg-white/10" />
            <div className="flex gap-2">
              <div className="h-9 w-28 rounded-full bg-white/10" />
              <div className="h-9 w-28 rounded-xl bg-white/10" />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i}>{taskRowSkeleton}</div>
            ))}
          </div>
        </div>

        {/* Focus Panel Skeleton */}
        <div className="card relative flex h-full flex-col space-y-4">
          <div className="h-8 w-24 rounded bg-white/10" />
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/10" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-5 w-1/2 rounded bg-white/10" />
              <div className="h-4 w-1/3 rounded bg-white/10" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="flex justify-between">
              <div className="h-4 w-20 rounded bg-white/10" />
              <div className="h-7 w-12 rounded bg-white/10" />
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/[0.06]" />
            <div className="h-3.5 w-24 rounded bg-white/5" />
          </div>
          <div className="mt-auto pt-4 space-y-3">
            <div className="h-3 w-28 rounded bg-white/5" />
            <div className="h-10 w-full rounded-xl bg-white/10" />
            <div className="h-4 w-28 rounded bg-white/10" />
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        {/* Due This Week Panel Skeleton */}
        <div className="card flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-44 rounded bg-white/10" />
          </div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.03] p-3">
                <div className="h-7 w-7 shrink-0 rounded-full bg-white/10" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-white/10" />
                  <div className="h-3 w-1/4 rounded bg-white/10" />
                </div>
                <div className="h-6 w-16 rounded-full bg-white/10 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Subjects Progress Panel Skeleton */}
        <div className="card flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="h-8 w-28 rounded bg-white/10" />
            <div className="h-8 w-16 rounded-xl bg-white/10" />
          </div>
          <div className="flex-1 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-line bg-white/[0.03] p-3 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-white/20" />
                  <div className="h-4 w-1/3 rounded bg-white/10 min-w-0 flex-1" />
                  <div className="h-3 w-20 rounded bg-white/10 shrink-0" />
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.06]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
