import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { ApiFetch } from "../../lib/api";
import type { Subject, Task } from "../../lib/types";
import { PRIORITY_TINT } from "../../lib/tasks";
import { EASE_OUT_EXPO } from "../../lib/motion";

/** Compact task row used across dashboard panels: toggle + title link + meta + optional trailing slot. */
export function TaskMiniRow({
  task,
  subject,
  apiFetch,
  reload,
  trailing,
}: {
  task: Task;
  subject?: Subject;
  apiFetch: ApiFetch;
  reload: () => Promise<void>;
  trailing?: ReactNode;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
      className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.03] p-3 transition-colors hover:border-line-strong"
    >
      <button
        type="button"
        onClick={async () => {
          const r = await apiFetch(`/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ completed: !task.completed }) });
          if (r.ok) await reload();
        }}
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition ${
          task.completed ? "border-sage bg-sage text-white" : "border-line-strong text-transparent hover:border-accent"
        }`}
        aria-label="Toggle task"
      >
        {task.completed && <CheckCircle2 size={16} />}
      </button>
      <div className="min-w-0 flex-1">
        <Link
          to={`/tasks/${task.id}`}
          className={`block truncate text-sm font-semibold transition hover:text-accent ${
            task.completed ? "text-faint line-through" : "text-fg"
          }`}
        >
          {task.title}
        </Link>
        <span className="flex items-center gap-1.5 text-xs text-dim">
          <span className={`text-[10px] ${PRIORITY_TINT[task.priority]}`}>●</span>
          <span className="capitalize">{task.priority}</span>
          {subject && <span className="truncate">· {subject.name}</span>}
        </span>
      </div>
      {trailing}
    </motion.div>
  );
}
