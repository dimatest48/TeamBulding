import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { CalendarDays } from "lucide-react";
import type { ApiFetch } from "../../lib/api";
import type { Subject, Task } from "../../lib/types";
import { daysUntil, isDueThisWeek, relativeDueLabel } from "../../lib/tasks";
import { TaskMiniRow } from "./TaskMiniRow";

/** Upcoming deadlines within the next 7 days, with relative "Today / Tomorrow / In N days" labels. */
export function DueThisWeekPanel({
  tasks,
  subjects,
  apiFetch,
  reload,
}: {
  tasks: Task[];
  subjects: Subject[];
  apiFetch: ApiFetch;
  reload: () => Promise<void>;
}) {
  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => !t.completed && isDueThisWeek(t))
        .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
        .slice(0, 5),
    [tasks],
  );

  return (
    <section className="card flex h-full flex-col">
      <h2 className="mb-4 flex items-center gap-2 text-2xl">
        <CalendarDays size={20} className="text-amber" /> Due this week
        <span className="rounded-full border border-line bg-white/5 px-2.5 py-0.5 text-sm font-semibold text-dim">{upcoming.length}</span>
      </h2>
      {upcoming.length === 0 ? (
        <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-line text-center">
          <p className="px-6 text-sm text-dim">Nothing due in the next 7 days.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {upcoming.map((task) => {
              const diff = daysUntil(task.due_date) ?? 99;
              const tint = diff <= 0 ? "bg-rose/15 text-rose" : diff <= 1 ? "bg-amber/20 text-amber" : "border border-line text-dim";
              return (
                <TaskMiniRow
                  key={task.id}
                  task={task}
                  subject={subjects.find((s) => s.id === task.subject_id)}
                  apiFetch={apiFetch}
                  reload={reload}
                  trailing={
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${tint}`}>
                      {relativeDueLabel(task.due_date)}
                    </span>
                  }
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
