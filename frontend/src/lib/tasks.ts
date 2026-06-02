import type { Priority, Task } from "./types";

export const PALETTE = ["#6366f1", "#e8a531", "#6f9b6e", "#e0573e", "#2f7c89", "#8b5cf6"];
export const DEFAULT_SUBJECT_COLOR = "#6366f1";

export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/** Tailwind text-color class for a priority dot/badge. */
export const PRIORITY_TINT: Record<Priority, string> = {
  high: "text-rose",
  medium: "text-amber",
  low: "text-sage",
};

export const todayInput = () => new Date().toISOString().slice(0, 10);

export function dateOnly(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function normalizeTaskText(value: string | null | undefined) {
  return (value || "")
    .trim()
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function taskDuplicateKey(task: Pick<Task, "title" | "notes" | "subject_id">) {
  return [
    normalizeTaskText(task.title),
    normalizeTaskText(task.notes),
    task.subject_id ?? "none",
  ].join("|");
}

export function dedupeTasks(tasks: Task[]) {
  const byKey = new Map<string, Task>();
  for (const task of tasks) {
    const key = taskDuplicateKey(task);
    const existing = byKey.get(key);
    if (!existing || task.id > existing.id) byKey.set(key, task);
  }
  return Array.from(byKey.values());
}

export function isOverdue(task: Task) {
  return Boolean(task.due_date && !task.completed && dateOnly(task.due_date) < todayInput());
}

export function isDueThisWeek(task: Task) {
  if (!task.due_date) return false;
  const due = new Date(dateOnly(task.due_date));
  const now = new Date(todayInput());
  const end = new Date(now);
  end.setDate(now.getDate() + 7);
  return due >= now && due <= end;
}

/** Whole-day difference between a due date and today (negative = overdue). */
export function daysUntil(due: string | null): number | null {
  if (!due) return null;
  const d = new Date(dateOnly(due)).getTime();
  const today = new Date(todayInput()).getTime();
  return Math.round((d - today) / 86_400_000);
}

/** Human-friendly relative deadline: "Today", "Tomorrow", "In 3 days", "2 days ago", "Mar 14". */
export function relativeDueLabel(due: string | null): string {
  const diff = daysUntil(due);
  if (diff === null) return "No date";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  if (diff <= 6) return `In ${diff} days`;
  return new Date(dateOnly(due)).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Completion stats for one subject. */
export function subjectProgress(subjectId: number, tasks: Task[]) {
  const list = tasks.filter((t) => t.subject_id === subjectId);
  const done = list.filter((t) => t.completed).length;
  return { total: list.length, done, active: list.length - done, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
}

export type TaskSort = "priority" | "due" | "recent";

/** Sort a task array by the chosen key (due-date nulls sink to the bottom). */
export function sortTasks(tasks: Task[], key: TaskSort): Task[] {
  const copy = [...tasks];
  if (key === "recent") return copy.sort((a, b) => b.id - a.id);
  if (key === "priority") {
    return copy.sort((a, b) => {
      const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (p !== 0) return p;
      const ad = a.due_date ?? "9999";
      const bd = b.due_date ?? "9999";
      return ad.localeCompare(bd);
    });
  }
  return copy.sort((a, b) => {
    if (!a.due_date && !b.due_date) return b.id - a.id;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  });
}
