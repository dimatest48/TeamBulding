import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ListFilter,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ApiFetch } from "../lib/api";
import type { Priority, StatusFilter, StudySession, Subject, Task } from "../lib/types";
import { dateOnly, isDueThisWeek, isOverdue, taskDuplicateKey } from "../lib/tasks";
import { EASE_OUT_EXPO } from "../lib/motion";

export function TaskList({
  tasks,
  subjects,
  apiFetch,
  reload,
  subjectScope,
  autoFocusNew = false,
}: {
  tasks: Task[];
  subjects: Subject[];
  apiFetch: ApiFetch;
  reload: () => Promise<void>;
  subjectScope?: number;
  autoFocusNew?: boolean;
}) {
  const newTaskRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState(subjectScope ? String(subjectScope) : "all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [newTask, setNewTask] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newTaskSubject, setNewTaskSubject] = useState(subjectScope ? String(subjectScope) : "");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("medium");
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [sessions, setSessions] = useState<Record<number, StudySession[]>>({});
  const [sessionTitle, setSessionTitle] = useState("");
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editPriority, setEditPriority] = useState<Priority>("medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (subjectScope) {
      setSubjectFilter(String(subjectScope));
      setNewTaskSubject(String(subjectScope));
    }
  }, [subjectScope]);

  useEffect(() => {
    if (autoFocusNew && newTaskRef.current) {
      newTaskRef.current.focus();
      newTaskRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [autoFocusNew]);

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((task) => (subjectFilter === "all" ? true : task.subject_id === Number(subjectFilter)))
      .filter((task) => (priorityFilter === "all" ? true : task.priority === priorityFilter))
      .filter((task) => {
        if (statusFilter === "active") return !task.completed;
        if (statusFilter === "completed") return task.completed;
        if (statusFilter === "overdue") return isOverdue(task);
        if (statusFilter === "week") return isDueThisWeek(task);
        return true;
      })
      .filter((task) => `${task.title} ${task.notes || ""}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => {
        if (!a.due_date && !b.due_date) return b.id - a.id;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });
  }, [priorityFilter, query, statusFilter, subjectFilter, tasks]);

  const addTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTask.trim()) return;
    const newTaskKey = taskDuplicateKey({
      title: newTask,
      notes: newNotes.trim() || null,
      subject_id: newTaskSubject ? Number(newTaskSubject) : null,
    });
    if (tasks.some((task) => taskDuplicateKey(task) === newTaskKey)) {
      window.alert("This task already exists.");
      return;
    }
    const response = await apiFetch("/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: newTask.trim(),
        notes: newNotes.trim() || null,
        priority: newTaskPriority,
        due_date: newDueDate ? new Date(newDueDate).toISOString() : null,
        subject_id: newTaskSubject ? Number(newTaskSubject) : null,
      }),
    });
    if (response.ok) {
      setNewTask("");
      setNewNotes("");
      setNewDueDate("");
      await reload();
    } else if (response.status === 409) {
      window.alert("This task already exists.");
    }
  };

  const updateTask = async (task: Task, patch: Partial<Task>) => {
    const response = await apiFetch(`/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify(patch) });
    if (response.ok) await reload();
  };

  const loadSessions = async (taskId: number) => {
    const response = await apiFetch(`/tasks/${taskId}/study-sessions`);
    if (response.ok) {
      const data = (await response.json()) as StudySession[];
      setSessions((prev) => ({ ...prev, [taskId]: data }));
    }
  };

  const addSession = async (taskId: number) => {
    if (!sessionTitle.trim()) return;
    const response = await apiFetch(`/tasks/${taskId}/study-sessions`, {
      method: "POST",
      body: JSON.stringify({ title: sessionTitle.trim() }),
    });
    if (response.ok) {
      setSessionTitle("");
      await loadSessions(taskId);
    }
  };

  const startEditing = (task: Task) => {
    setEditingTask(task.id);
    setExpandedTask(task.id);
    setEditTitle(task.title);
    setEditSubject(task.subject_id ? String(task.subject_id) : "");
    setEditPriority(task.priority);
    setEditDueDate(dateOnly(task.due_date));
    setEditNotes(task.notes || "");
  };

  const submitTaskEdit = async (task: Task) => {
    await updateTask(task, {
      title: editTitle.trim(),
      subject_id: editSubject ? Number(editSubject) : null,
      priority: editPriority,
      due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
      notes: editNotes.trim() || null,
    });
    setEditingTask(null);
  };

  return (
    <section className="card">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl">Tasks</h2>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white/[0.03] px-3 py-2 text-sm text-dim">
          <ListFilter size={17} /> {visibleTasks.length} shown
        </div>
      </div>

      <form onSubmit={addTask} className="mb-5 grid gap-3 xl:grid-cols-[1fr_180px_140px_150px_auto]">
        <input ref={newTaskRef} className="field m-0" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="New task" />
        <select className="field m-0" value={newTaskSubject} onChange={(e) => setNewTaskSubject(e.target.value)}>
          <option value="">No subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        <select className="field m-0" value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as Priority)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input className="field m-0" type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
        <button className="btn-primary px-4" type="submit" aria-label="Add task">
          <Plus size={18} />
        </button>
        <textarea
          className="field xl:col-span-5"
          value={newNotes}
          onChange={(e) => setNewNotes(e.target.value)}
          placeholder="Notes for this task"
          rows={2}
        />
      </form>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_160px_150px_150px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={17} />
          <input className="field m-0 pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks" />
        </label>
        <select className="field m-0" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} disabled={Boolean(subjectScope)}>
          <option value="all">All subjects</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        <select className="field m-0" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
          <option value="week">This week</option>
        </select>
        <select className="field m-0" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as Priority | "all")}>
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="space-y-3">
        {visibleTasks.length === 0 && (
          <p className="rounded-xl border border-line bg-white/[0.03] px-4 py-8 text-center text-dim">
            No tasks match this view.
          </p>
        )}
        <AnimatePresence initial={false}>
          {visibleTasks.map((task) => {
            const subject = subjects.find((s) => s.id === task.subject_id);
            const expanded = expandedTask === task.id;
            return (
              <motion.article
                key={task.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
                className="rounded-xl border border-line bg-white/[0.03] p-3.5 transition-colors hover:border-line-strong"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateTask(task, { completed: !task.completed })}
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition ${
                      task.completed ? "border-sage bg-sage text-white" : "border-line-strong text-transparent hover:border-accent"
                    }`}
                    aria-label="Toggle task"
                  >
                    {task.completed && <CheckCircle2 size={18} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <Link
                      className={`block truncate font-semibold transition hover:text-accent ${
                        task.completed ? "text-faint line-through" : "text-fg"
                      }`}
                      to={`/tasks/${task.id}`}
                    >
                      {task.title}
                    </Link>
                    <span className="text-xs capitalize text-dim">
                      {task.priority} priority{subject ? ` · ${subject.name}` : ""}
                      {task.due_date ? ` · due ${dateOnly(task.due_date)}` : ""}
                    </span>
                  </div>
                  {subject?.shared && (
                    <span className="rounded-full border border-line bg-white/5 px-2.5 py-1 text-xs font-semibold text-dim">
                      Shared
                    </span>
                  )}
                  {isOverdue(task) && (
                    <span className="rounded-full bg-rose/15 px-2.5 py-1 text-xs font-semibold text-rose">Overdue</span>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      const next = expanded ? null : task.id;
                      setExpandedTask(next);
                      if (next) await loadSessions(task.id);
                    }}
                    className="icon-btn"
                    aria-label="Study planner"
                  >
                    <ChevronDown className={`transition ${expanded ? "rotate-180" : ""}`} size={17} />
                  </button>
                  <button type="button" onClick={() => startEditing(task)} className="icon-btn" aria-label="Edit task">
                    <Pencil size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm("Delete this task?")) {
                        const response = await apiFetch(`/tasks/${task.id}`, { method: "DELETE" });
                        if (response.ok) await reload();
                      }
                    }}
                    className="icon-btn hover:bg-rose/10 hover:text-rose"
                    aria-label="Delete task"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                {expanded && (
                  <div className="mt-4 border-t border-line pt-4">
                    {editingTask === task.id ? (
                      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_160px_140px_150px]">
                        <input className="field m-0" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Task title" />
                        <select className="field m-0" value={editSubject} onChange={(e) => setEditSubject(e.target.value)}>
                          <option value="">No subject</option>
                          {subjects.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        <select className="field m-0" value={editPriority} onChange={(e) => setEditPriority(e.target.value as Priority)}>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                        <input className="field m-0" type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                        <textarea className="field lg:col-span-4" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Task notes" rows={2} />
                        <div className="flex gap-2 lg:col-span-4">
                          <button className="btn-primary px-4 py-2" type="button" onClick={() => submitTaskEdit(task)}>
                            Save changes
                          </button>
                          <button className="btn-outline px-4 py-2" type="button" onClick={() => setEditingTask(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mb-4 rounded-xl border border-line bg-white/[0.02] p-3 text-sm text-dim">
                        {task.notes || "No notes yet."}
                      </p>
                    )}
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                      <input className="field m-0" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} placeholder="Break into a study session" />
                      <button className="btn-outline px-4" type="button" onClick={() => addSession(task.id)}>
                        <Plus size={18} /> Session
                      </button>
                    </div>
                    <div className="mt-3 space-y-2">
                      {(sessions[task.id] || []).map((session) => (
                        <label key={session.id} className="flex items-center gap-3 rounded-lg border border-line bg-white/[0.02] px-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            checked={session.completed}
                            onChange={async () => {
                              const response = await apiFetch(`/study-sessions/${session.id}`, {
                                method: "PATCH",
                                body: JSON.stringify({ completed: !session.completed }),
                              });
                              if (response.ok) await loadSessions(task.id);
                            }}
                          />
                          <span className={session.completed ? "text-faint line-through" : "text-fg"}>{session.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
