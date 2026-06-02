import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListTodo,
  Target,
} from "lucide-react";
import type { Subject, Task } from "../lib/types";
import { isDueThisWeek, isOverdue } from "../lib/tasks";

export function DashboardCards({ tasks, subjects }: { tasks: Task[]; subjects: Subject[] }) {
  const completed = tasks.filter((task) => task.completed).length;
  const overdue = tasks.filter(isOverdue).length;
  const week = tasks.filter(isDueThisWeek).length;
  const completion = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const busiest = subjects
    .map((subject) => ({
      subject,
      count: tasks.filter((task) => task.subject_id === subject.id && !task.completed).length,
    }))
    .sort((a, b) => b.count - a.count)[0];

  return (
    <div className="mb-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {[
        ["Active", tasks.length - completed, ListTodo, "bg-accent/15 text-accent"],
        ["Due this week", week, CalendarDays, "bg-amber/20 text-amber"],
        ["Overdue", overdue, Clock3, "bg-rose/15 text-rose"],
        ["Complete", `${completion}%`, CheckCircle2, "bg-sage/20 text-sage"],
        ["Focus", busiest?.subject.name || "None", Target, "bg-accent-2/15 text-accent-2"],
      ].map(([label, value, Icon, tint]) => {
        const I = Icon as React.ComponentType<{ size?: number; className?: string }>;
        return (
          <div key={label as string} className="card flex min-h-[108px] items-center gap-4">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tint as string}`}>
              <I size={22} />
            </div>
            <div className="min-w-0">
              <strong className="block truncate text-2xl text-fg">{value as string | number}</strong>
              <span className="text-sm text-dim">{label as string}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
