import { useMemo } from "react";
import { ArrowRight, Folders, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Subject, Task } from "../../lib/types";
import { subjectProgress } from "../../lib/tasks";

/** Subjects ranked by least-complete-first, each with a mini progress bar. */
export function SubjectsProgressPanel({ subjects, tasks }: { subjects: Subject[]; tasks: Task[] }) {
  const navigate = useNavigate();
  const ranked = useMemo(
    () =>
      subjects
        .map((s) => ({ subject: s, ...subjectProgress(s.id, tasks) }))
        .sort((a, b) => a.pct - b.pct)
        .slice(0, 6),
    [subjects, tasks],
  );

  return (
    <section className="card flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl">
          <Folders size={20} className="text-accent-2" /> Subjects
          <span className="rounded-full border border-line bg-white/5 px-2.5 py-0.5 text-sm font-semibold text-dim">{subjects.length}</span>
        </h2>
        <button className="btn-outline px-3 py-1.5 text-sm" type="button" onClick={() => navigate("/subjects?new=1")}>
          <Plus size={16} /> Add
        </button>
      </div>

      {ranked.length === 0 ? (
        <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-line text-center">
          <p className="px-6 text-sm text-dim">No subjects yet — create one to group your tasks.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-3">
          {ranked.map(({ subject, total, pct }) => (
            <Link
              key={subject.id}
              to={`/subjects/${subject.id}`}
              className="block rounded-xl border border-line bg-white/[0.03] p-3 transition-colors hover:border-line-strong"
            >
              <div className="mb-2 flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: subject.color }} />
                <strong className="min-w-0 flex-1 truncate text-sm text-fg">{subject.name}</strong>
                <span className="shrink-0 text-xs text-dim">
                  {total} {total === 1 ? "task" : "tasks"} · {pct}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {subjects.length > 0 && (
        <Link to="/subjects" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition hover:gap-2.5">
          Manage subjects <ArrowRight size={16} />
        </Link>
      )}
    </section>
  );
}
