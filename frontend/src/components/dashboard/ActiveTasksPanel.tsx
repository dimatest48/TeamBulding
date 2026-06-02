import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, ListTodo, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { ApiFetch } from "../../lib/api";
import type { Subject, Task } from "../../lib/types";
import { sortTasks, type TaskSort } from "../../lib/tasks";
import { TaskMiniRow } from "./TaskMiniRow";

const SORTS: { key: TaskSort; label: string }[] = [
  { key: "priority", label: "Priority" },
  { key: "due", label: "Due date" },
  { key: "recent", label: "Recent" },
];

/** Large panel showing the next few active tasks, sortable, with a quick "create task" action. */
export function ActiveTasksPanel({
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
  const navigate = useNavigate();
  const [sort, setSort] = useState<TaskSort>("priority");
  const active = useMemo(() => sortTasks(tasks.filter((t) => !t.completed), sort).slice(0, 6), [tasks, sort]);
  const activeCount = tasks.filter((t) => !t.completed).length;

  return (
    <section className="card flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl">
          <ListTodo size={20} className="text-accent" /> Active tasks
          <span className="rounded-full border border-line bg-white/5 px-2.5 py-0.5 text-sm font-semibold text-dim">{activeCount}</span>
        </h2>
        <div className="flex items-center gap-2">
          <select
            className="rounded-full border border-line bg-panel px-3 py-1.5 text-sm text-fg outline-none focus:border-accent"
            value={sort}
            onChange={(e) => setSort(e.target.value as TaskSort)}
            aria-label="Sort active tasks"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                Sort: {s.label}
              </option>
            ))}
          </select>
          <button className="btn-primary px-4 py-2 text-sm" type="button" onClick={() => navigate("/tasks?new=1")}>
            <Plus size={16} /> Create task
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {active.length === 0 ? (
          <div className="grid h-full min-h-[160px] place-items-center rounded-xl border border-dashed border-line text-center">
            <div>
              <p className="text-dim">No active tasks — you're all caught up.</p>
              <button className="btn-outline mt-3 px-4 py-2 text-sm" type="button" onClick={() => navigate("/tasks?new=1")}>
                <Plus size={16} /> Add a task
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {active.map((task) => (
              <TaskMiniRow
                key={task.id}
                task={task}
                subject={subjects.find((s) => s.id === task.subject_id)}
                apiFetch={apiFetch}
                reload={reload}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {activeCount > active.length && (
        <Link to="/tasks" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition hover:gap-2.5">
          View all {activeCount} tasks <ArrowRight size={16} />
        </Link>
      )}
    </section>
  );
}
