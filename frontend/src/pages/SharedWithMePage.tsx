import { useMemo } from "react";
import { motion } from "framer-motion";
import { Eye, Pencil, Inbox } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { PageHeader } from "../components/PageHeader";
import { HeroOrb } from "../components/HeroOrb";
import { useWorkspaceData } from "../lib/useWorkspaceData";
import { dateOnly } from "../lib/tasks";
import { EASE_OUT_EXPO, emptyStateContent } from "../lib/motion";
import type { Task } from "../lib/types";
import { SkeletonList } from "../components/SkeletonList";

function RoleChip({ task }: { task: Task }) {
  const editor = task.role === "editor";
  const Icon = editor ? Pencil : Eye;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-dim">
      <Icon size={13} className="text-accent" /> {editor ? "Can edit" : "Can view"}
    </span>
  );
}

export function SharedWithMePage() {
  const { tasks, loading } = useWorkspaceData();
  const shared = useMemo(() => tasks.filter((task) => task.shared_with_me), [tasks]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Workspace"
        title="Shared with me"
        subtitle="Tasks other people have given you access to."
        actions={<UserButton afterSignOutUrl="/" />}
      />

      {loading ? (
        <SkeletonList plain />
      ) : shared.length === 0 ? (
        <div className="relative grid min-h-[55vh] place-items-center overflow-hidden rounded-card border border-line bg-canvas px-6 py-16 text-center">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 50% 45% at 50% 40%, rgba(99,102,241,0.10) 0%, rgba(0,0,0,0) 70%)",
            }}
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-center">
            <HeroOrb size={132} />
            <motion.div variants={emptyStateContent} custom={0} initial="hidden" animate="show" className="mt-9 grid place-items-center">
              <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] text-dim">
                <Inbox size={24} />
              </span>
            </motion.div>
            <motion.h2 variants={emptyStateContent} custom={1} initial="hidden" animate="show" className="text-3xl font-bold text-fg">
              Nothing shared yet
            </motion.h2>
            <motion.p
              variants={emptyStateContent}
              custom={2}
              initial="hidden"
              animate="show"
              className="mt-3 max-w-[36ch] text-base leading-relaxed text-dim"
            >
              When a classmate shares a task with you, it will appear right here — ready to view or edit.
            </motion.p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {shared.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: index * 0.04 }}
            >
              <Link
                to={`/tasks/${task.id}`}
                className="flex items-center gap-4 rounded-card border border-line bg-panel p-4 shadow-soft-sm transition hover:-translate-y-0.5 hover:border-line-strong"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-sm font-semibold text-white">
                  {(task.owner_name ?? "?").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <strong className={`block truncate text-base ${task.completed ? "text-faint line-through" : "text-fg"}`}>
                    {task.title}
                  </strong>
                  <span className="text-sm text-dim">
                    Shared by {task.owner_name ?? "someone"}
                    {task.due_date ? ` · due ${dateOnly(task.due_date)}` : ""}
                  </span>
                </div>
                <RoleChip task={task} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
