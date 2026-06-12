export function SkeletonSubjects() {
  return (
    <div className="card animate-pulse space-y-6">
      {/* Header */}
      <div className="h-8 w-32 rounded bg-white/10" />

      {/* Add subject form placeholder */}
      <div className="grid gap-3">
        <div className="h-10 w-full rounded-xl bg-white/10" />
        <div className="h-10 w-full rounded-xl bg-white/10" />
      </div>

      {/* List of subjects placeholders */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-line bg-white/[0.03] p-3">
            <div className="flex items-center gap-3">
              {/* Initials box */}
              <div className="h-10 w-10 shrink-0 rounded-xl bg-white/10" />

              {/* Title & Stats */}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-1/4 rounded bg-white/10" />
                <div className="h-3 w-1/3 rounded bg-white/10" />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-lg bg-white/5" />
                <div className="h-8 w-8 rounded-lg bg-white/5" />
                <div className="h-8 w-8 rounded-lg bg-white/5" />
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 w-full rounded-full bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
