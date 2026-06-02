import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Subject, Task } from "../lib/types";
import { DEFAULT_SUBJECT_COLOR, dateOnly } from "../lib/tasks";
import { EASE_OUT_EXPO } from "../lib/motion";

export function SubjectsPanel({
  subjects,
  tasks,
  onCreateSubject,
  onRenameSubject,
  onDeleteSubject,
}: {
  subjects: Subject[];
  tasks: Task[];
  onCreateSubject: (name: string, color: string) => Promise<void>;
  onRenameSubject: (id: number, name: string) => Promise<void>;
  onDeleteSubject: (id: number) => Promise<void>;
}) {
  const [newSubject, setNewSubject] = useState("");
  const [openSubject, setOpenSubject] = useState<number | null>(subjects[0]?.id ?? null);
  const [editingSubject, setEditingSubject] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  return (
    <section className="card">
      <h2 className="mb-5 text-2xl">Subjects</h2>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!newSubject.trim()) return;
          await onCreateSubject(newSubject.trim(), DEFAULT_SUBJECT_COLOR);
          setNewSubject("");
        }}
        className="mb-5 grid gap-3"
      >
        <input className="field" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Subject name" />
        <button className="btn-primary w-full" type="submit">
          <Plus size={18} /> Add subject
        </button>
      </form>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {subjects.map((subject) => {
            const subjectTasks = tasks.filter((task) => task.subject_id === subject.id);
            const completed = subjectTasks.filter((task) => task.completed).length;
            const progress = subjectTasks.length ? Math.round((completed / subjectTasks.length) * 100) : 0;
            const isOpen = openSubject === subject.id;
            const initials = subject.name.slice(0, 2).toUpperCase();

            return (
              <motion.article
                key={subject.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
                className="rounded-xl border border-line bg-white/[0.03] p-3 transition-colors hover:border-line-strong"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOpenSubject(isOpen ? null : subject.id)}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-sm font-semibold text-white shadow-soft-sm"
                    style={{ background: `linear-gradient(145deg, ${subject.color}, ${subject.color}aa)` }}
                    aria-label={`Toggle ${subject.name}`}
                  >
                    {initials}
                  </button>
                  <div className="min-w-0 flex-1">
                    {editingSubject === subject.id ? (
                      <form
                        className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] gap-2"
                        onSubmit={async (event) => {
                          event.preventDefault();
                          if (!editingName.trim()) return;
                          await onRenameSubject(subject.id, editingName.trim());
                          setEditingSubject(null);
                        }}
                      >
                        <input className="field m-0 w-full min-w-0 py-2 text-sm" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                        <button className="btn-primary px-3 py-2 text-sm" type="submit">
                          Save
                        </button>
                        <button className="btn-outline px-3 py-2 text-sm" type="button" onClick={() => setEditingSubject(null)}>
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <Link to={`/subjects/${subject.id}`}>
                        <strong className="block truncate text-sm text-fg">{subject.name}</strong>
                        <span className="text-xs text-dim">
                          {subjectTasks.length} tasks · {progress}% complete
                        </span>
                      </Link>
                    )}
                  </div>
                  {editingSubject !== subject.id && (
                    <button
                      type="button"
                      onClick={() => setOpenSubject(isOpen ? null : subject.id)}
                      className="icon-btn"
                      aria-label={`Show tasks for ${subject.name}`}
                    >
                      <ChevronDown className={`transition ${isOpen ? "rotate-180" : ""}`} size={17} />
                    </button>
                  )}
                  {subject.role === "owner" && editingSubject !== subject.id && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSubject(subject.id);
                          setEditingName(subject.name);
                        }}
                        className="icon-btn"
                        aria-label="Rename subject"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSubject(subject.id)}
                        className="icon-btn hover:bg-rose/10 hover:text-rose"
                        aria-label="Delete subject"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {isOpen && (
                  <div className="mt-3 space-y-2 border-t border-line pt-3">
                    {subjectTasks.length === 0 && <p className="text-sm text-dim">No tasks in this subject yet.</p>}
                    {subjectTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 rounded-lg border border-line bg-white/[0.02] px-3 py-2 text-sm">
                        <CheckCircle2 className={task.completed ? "text-sage" : "text-faint"} size={16} />
                        <div className="min-w-0 flex-1">
                          <span className={`block truncate ${task.completed ? "text-faint line-through" : "text-fg"}`}>{task.title}</span>
                          <span className="text-xs capitalize text-dim">
                            {task.priority}
                            {task.due_date ? ` · ${dateOnly(task.due_date)}` : ""}
                          </span>
                        </div>
                      </div>
                    ))}
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
