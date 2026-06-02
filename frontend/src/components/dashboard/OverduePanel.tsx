import { AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import type { ApiFetch } from "../../lib/api";
import type { Subject, Task } from "../../lib/types";
import { relativeDueLabel } from "../../lib/tasks";
import { TaskMiniRow } from "./TaskMiniRow";

/** Red-accented section for overdue tasks — only rendered when there are any (EP-05 / T-26). */
export function OverduePanel({
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
  if (tasks.length === 0) return null;
  return (
    <section className="card mb-6 border-rose/40 bg-rose/[0.06]">
      <h2 className="mb-4 flex items-center gap-2 text-2xl text-rose">
        <AlertTriangle size={20} /> Overdue
        <span className="rounded-full bg-rose/20 px-2.5 py-0.5 text-sm font-semibold text-rose">{tasks.length}</span>
      </h2>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {tasks.slice(0, 5).map((task) => (
            <TaskMiniRow
              key={task.id}
              task={task}
              subject={subjects.find((s) => s.id === task.subject_id)}
              apiFetch={apiFetch}
              reload={reload}
              trailing={<span className="shrink-0 rounded-full bg-rose/15 px-2.5 py-1 text-xs font-semibold text-rose">{relativeDueLabel(task.due_date)}</span>}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
