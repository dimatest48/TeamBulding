import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Target } from "lucide-react";
import { Link } from "react-router-dom";
import type { Subject, Task } from "../../lib/types";
import { subjectProgress } from "../../lib/tasks";

const STORAGE_KEY = "tasker.focusSubjectId";

/** Large focus card: pick a subject to focus on and watch its completion progress. */
export function FocusPanel({ subjects, tasks }: { subjects: Subject[]; tasks: Task[] }) {
  // Default to the subject with the most active (incomplete) tasks.
  const busiestId = useMemo(() => {
    if (subjects.length === 0) return null;
    return subjects
      .map((s) => ({ id: s.id, active: subjectProgress(s.id, tasks).active }))
      .sort((a, b) => b.active - a.active)[0].id;
  }, [subjects, tasks]);

  const [focusId, setFocusId] = useState<number | null>(null);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    const valid = subjects.some((s) => s.id === stored);
    setFocusId(valid ? stored : busiestId);
  }, [busiestId, subjects]);

  const focused = subjects.find((s) => s.id === focusId) ?? null;
  const stats = focused ? subjectProgress(focused.id, tasks) : null;

  const choose = (id: number) => {
    setFocusId(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  };

  return (
    <section className="card relative flex h-full flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl"
        style={{ background: focused ? `${focused.color}` : "#6366f1" }}
        aria-hidden="true"
      />
      <h2 className="relative mb-4 flex items-center gap-2 text-2xl">
        <Target size={20} className="text-accent-2" /> Focus
      </h2>

      {!focused || !stats ? (
        <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-line text-center">
          <p className="px-6 text-sm text-dim">Add a subject to set your focus for the week.</p>
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col">
          <div className="mb-5 flex items-center gap-4">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-lg font-semibold text-white shadow-soft-sm"
              style={{ background: `linear-gradient(145deg, ${focused.color}, ${focused.color}aa)` }}
            >
              {focused.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <strong className="block truncate text-xl text-fg">{focused.name}</strong>
              <span className="text-sm text-dim">
                {stats.active} active · {stats.total} total
              </span>
            </div>
          </div>

          {/* progress */}
          <div className="mb-2 flex items-end justify-between">
            <span className="text-sm text-dim">Completion</span>
            <strong className="font-display text-3xl text-fg">{stats.pct}%</strong>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all" style={{ width: `${stats.pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-faint">
            {stats.done} of {stats.total} tasks complete
          </p>

          <div className="mt-auto pt-5">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-faint">Change focus</label>
            <select
              className="field m-0 py-2.5"
              value={focused.id}
              onChange={(e) => choose(Number(e.target.value))}
              aria-label="Change focus subject"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Link
              to={`/subjects/${focused.id}`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition hover:gap-2.5"
            >
              Open subject <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
