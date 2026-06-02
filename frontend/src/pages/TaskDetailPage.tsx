import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Image as ImageIcon, Maximize2, Pencil, Plus, Share2, X } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { EditableTitle } from "../components/EditableTitle";
import { ShareModal } from "../components/ShareModal";
import { useConfirm } from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import { useWorkspaceData } from "../lib/useWorkspaceData";
import { dateOnly } from "../lib/tasks";
import type { Priority, StudySession, TaskAttachment } from "../lib/types";

export function TaskDetailPage() {
  const { taskId } = useParams();
  const id = Number(taskId);
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const { apiFetch, subjects, tasks, load } = useWorkspaceData();
  const task = tasks.find((item) => item.id === id);
  const subject = subjects.find((item) => item.id === task?.subject_id);
  const isOwner = task?.role === "owner";
  const canEdit = task?.role === "owner" || task?.role === "editor";
  const viewOnly = Boolean(task) && !canEdit;
  const [sharing, setSharing] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [sessionTitle, setSessionTitle] = useState("");
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [savingDraft, setSavingDraft] = useState(false);
  const [screenshotHelp, setScreenshotHelp] = useState(false);
  const [previewImage, setPreviewImage] = useState<TaskAttachment | null>(null);
  const draftRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setSubjectId(task.subject_id ? String(task.subject_id) : "");
    setPriority(task.priority);
    setDueDate(dateOnly(task.due_date));
    setNotes(task.notes || "");
  }, [task]);

  const loadSessions = useCallback(async () => {
    if (!id) return;
    const response = await apiFetch(`/tasks/${id}/study-sessions`);
    if (response.ok) setSessions(await response.json());
  }, [apiFetch, id]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const loadAttachments = useCallback(async () => {
    if (!id) return;
    const response = await apiFetch(`/tasks/${id}/attachments`);
    if (response.ok) setAttachments(await response.json());
  }, [apiFetch, id]);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);

  const saveDraft = async () => {
    if (!task) return;
    setSavingDraft(true);
    try {
      const response = await apiFetch(`/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ notes: notes.trim() || null }),
      });
      if (response.ok) await load();
    } finally {
      setSavingDraft(false);
    }
  };

  const uploadImage = async (file: File) => {
    if (!task || !file.type.startsWith("image/")) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const response = await apiFetch(`/tasks/${task.id}/attachments`, {
      method: "POST",
      body: JSON.stringify({
        filename: file.name || `pasted-image-${Date.now()}.png`,
        mime_type: file.type,
        data_url: dataUrl,
      }),
    });
    if (response.ok) await loadAttachments();
  };

  const handleDraftPaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const imageItems = Array.from(event.clipboardData.items).filter((item) => item.type.startsWith("image/"));
    if (imageItems.length === 0) return;
    event.preventDefault();
    for (const item of imageItems) {
      const file = item.getAsFile();
      if (file) await uploadImage(file);
    }
  };

  const handleImageDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const imageFiles = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
    for (const file of imageFiles) {
      await uploadImage(file);
    }
  };

  const saveTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!task || !title.trim()) return;
    const response = await apiFetch(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: title.trim(),
        subject_id: subjectId ? Number(subjectId) : null,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        notes: notes.trim() || null,
      }),
    });
    if (response.ok) await load();
  };

  return (
    <AppShell>
      <header className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            className="text-sm font-semibold text-dim transition hover:text-fg"
            to={task?.shared_with_me ? "/shared" : "/tasks"}
          >
            {task?.shared_with_me ? "Back to shared with me" : "Back to tasks"}
          </Link>
          <EditableTitle
            className="mt-2 font-display text-3xl font-semibold sm:text-4xl"
            value={task?.title || "Task details"}
            editable={Boolean(task) && canEdit}
            placeholder="Task details"
            onSave={async (title) => {
              if (!task) return;
              const r = await apiFetch(`/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ title }) });
              if (r.ok) await load();
            }}
          />
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-dim">
            <span>
              {subject?.name || "No subject"}
              {task?.due_date ? ` · due ${dateOnly(task.due_date)}` : ""}
            </span>
            {task?.shared_with_me && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/[0.04] px-2.5 py-1 text-xs font-semibold">
                {viewOnly ? <Eye size={13} className="text-accent" /> : <Pencil size={13} className="text-accent" />}
                {viewOnly ? "View only" : "Can edit"} · shared by {task.owner_name ?? "someone"}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {task && isOwner && (
            <button className="btn-ghost" type="button" onClick={() => setSharing(true)}>
              <Share2 size={17} /> Share
            </button>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {!task ? (
        <div className="card max-w-[680px]">
          <p className="text-dim">Task not found or still loading.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl">Draft</h2>
                <p className="mt-1 text-sm text-dim">Write study notes and paste screenshots directly into this task.</p>
              </div>
              {!viewOnly && (
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-outline px-4 py-2"
                    type="button"
                    onClick={() => {
                      setScreenshotHelp(true);
                      draftRef.current?.focus();
                    }}
                  >
                    <ImageIcon size={17} /> Add screenshot
                  </button>
                  <button className="btn-primary px-4 py-2" type="button" onClick={saveDraft} disabled={savingDraft}>
                    {savingDraft ? "Saving..." : "Save draft"}
                  </button>
                </div>
              )}
              {viewOnly && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-dim">
                  <Eye size={13} /> View only
                </span>
              )}
            </div>
            {screenshotHelp && (
              <div className="rounded-xl border border-accent/30 bg-accent/[0.08] p-4 text-sm text-dim">
                Press <strong className="text-fg">Cmd + Ctrl + Shift + 4</strong>, select an area, then press{" "}
                <strong className="text-fg">Cmd + V</strong> inside the draft. You can also drag an image into Visual notes.
              </div>
            )}
            <textarea
              ref={draftRef}
              className={`field min-h-[300px] text-base leading-relaxed ${viewOnly ? "cursor-not-allowed opacity-70" : ""}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onPaste={handleDraftPaste}
              readOnly={viewOnly}
              title={viewOnly ? "View only — you don't have edit access" : undefined}
              placeholder={viewOnly ? "No notes yet." : "Write notes for this task. Use macOS screenshot to clipboard, then paste here."}
            />
            <div
              className="rounded-xl border border-dashed border-line bg-white/[0.02] p-4 transition hover:border-accent/60"
              onDragOver={(event) => event.preventDefault()}
              onDrop={viewOnly ? undefined : handleImageDrop}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-dim">
                  <ImageIcon size={18} /> Visual notes
                </div>
                {!viewOnly && (
                  <label className="btn-outline cursor-pointer px-4 py-2 text-sm">
                    Add image
                    <input
                      className="hidden"
                      type="file"
                      accept="image/*"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (file) await uploadImage(file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
              {attachments.length === 0 ? (
                <div className="grid min-h-[140px] place-items-center rounded-xl border border-line bg-white/[0.02] px-5 py-8 text-center">
                  <p className="max-w-[36ch] text-sm text-dim">
                    {viewOnly ? (
                      "No images attached to this task."
                    ) : (
                      <>
                        Paste a screenshot with <strong className="text-fg">Cmd + V</strong>, drag an image here, or add an image file.
                      </>
                    )}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {attachments.map((attachment) => (
                    <figure key={attachment.id} className="overflow-hidden rounded-xl border border-line bg-white/[0.03]">
                      <button
                        type="button"
                        className="block w-full bg-black/40"
                        onClick={() => setPreviewImage(attachment)}
                        aria-label={`Open ${attachment.filename}`}
                      >
                        <img className="max-h-[260px] w-full object-contain" src={attachment.data_url} alt={attachment.filename} />
                      </button>
                      <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-dim">
                        <span className="truncate">{attachment.filename}</span>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/10 hover:text-fg"
                            type="button"
                            aria-label="Preview image"
                            onClick={() => setPreviewImage(attachment)}
                          >
                            <Maximize2 size={15} />
                          </button>
                          <a
                            className="rounded-full px-2 py-1 font-semibold hover:bg-white/10 hover:text-fg"
                            href={attachment.data_url}
                            download={attachment.filename}
                          >
                            Download
                          </a>
                          {!viewOnly && (
                            <button
                              className="grid h-7 w-7 place-items-center rounded-full hover:bg-rose/10 hover:text-rose"
                              type="button"
                              aria-label="Delete image"
                              onClick={async () => {
                                const response = await apiFetch(`/task-attachments/${attachment.id}`, { method: "DELETE" });
                                if (response.ok) await loadAttachments();
                              }}
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </div>
          </section>

          {previewImage && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4" role="dialog" aria-modal="true">
              <div className="max-h-[92vh] w-full max-w-[1100px] overflow-hidden rounded-card border border-line bg-elevated shadow-soft">
                <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                  <strong className="truncate text-sm text-fg">{previewImage.filename}</strong>
                  <div className="flex items-center gap-2">
                    <a className="btn-outline px-4 py-2 text-sm" href={previewImage.data_url} download={previewImage.filename}>
                      Download
                    </a>
                    <button className="icon-btn" type="button" onClick={() => setPreviewImage(null)} aria-label="Close preview">
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="max-h-[82vh] overflow-auto bg-black/40 p-4">
                  <img className="mx-auto max-w-none" src={previewImage.data_url} alt={previewImage.filename} />
                </div>
              </div>
            </div>
          )}

          <aside className="space-y-6">
            <form className="card space-y-4" onSubmit={saveTask}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl">Task settings</h2>
                {viewOnly && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-dim"
                    title="You don't have edit access to this task"
                  >
                    <Eye size={13} /> View only
                  </span>
                )}
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-dim">Title</span>
                <input
                  className={`field ${viewOnly ? "cursor-not-allowed opacity-70" : ""}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={viewOnly}
                  title={viewOnly ? "View only — you don't have edit access" : undefined}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-dim">Subject</span>
                <select
                  className={`field ${viewOnly ? "cursor-not-allowed opacity-70" : ""}`}
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  disabled={viewOnly}
                  title={viewOnly ? "View only — you don't have edit access" : undefined}
                >
                  <option value="">No subject</option>
                  {subjects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <label className="block">
                  <span className="text-sm font-semibold text-dim">Priority</span>
                  <select
                    className={`field ${viewOnly ? "cursor-not-allowed opacity-70" : ""}`}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    disabled={viewOnly}
                    title={viewOnly ? "View only — you don't have edit access" : undefined}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-dim">Due date</span>
                  <input
                    className={`field ${viewOnly ? "cursor-not-allowed opacity-70" : ""}`}
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={viewOnly}
                    title={viewOnly ? "View only — you don't have edit access" : undefined}
                  />
                </label>
              </div>
              {viewOnly ? (
                <p className="rounded-xl border border-line bg-white/[0.03] p-3.5 text-sm text-dim">
                  You have view-only access. Ask {task.owner_name ?? "the owner"} for edit access to make changes.
                </p>
              ) : (
                <div className="grid gap-3">
                  <button className="btn-primary w-full" type="submit">
                    Save settings
                  </button>
                  <button
                    className="btn-outline w-full"
                    type="button"
                    onClick={async () => {
                      const response = await apiFetch(`/tasks/${task.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ completed: !task.completed }),
                      });
                      if (response.ok) await load();
                    }}
                  >
                    {task.completed ? "Mark active" : "Mark complete"}
                  </button>
                  {isOwner && (
                    <button
                      className="btn-outline w-full text-rose"
                      type="button"
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Delete this task?",
                          message: "This permanently removes the task and revokes access for anyone it's shared with.",
                          confirmLabel: "Delete task",
                        });
                        if (!ok) return;
                        const response = await apiFetch(`/tasks/${task.id}`, { method: "DELETE" });
                        if (response.ok) {
                          toast.success("Task deleted");
                          navigate("/tasks");
                        } else {
                          toast.error("Could not delete the task");
                        }
                      }}
                    >
                      Delete task
                    </button>
                  )}
                </div>
              )}
            </form>

            <section className="card">
              <h2 className="mb-5 text-2xl">Study sessions</h2>
              {!viewOnly && (
                <div className="mb-4 grid gap-3">
                  <input className="field" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} placeholder="New study session" />
                  <button
                    className="btn-primary w-full"
                    type="button"
                    onClick={async () => {
                      if (!sessionTitle.trim()) return;
                      const response = await apiFetch(`/tasks/${task.id}/study-sessions`, {
                        method: "POST",
                        body: JSON.stringify({ title: sessionTitle.trim() }),
                      });
                      if (response.ok) {
                        setSessionTitle("");
                        await loadSessions();
                      }
                    }}
                  >
                    <Plus size={18} /> Add session
                  </button>
                </div>
              )}
              <div className="space-y-2">
                {sessions.length === 0 && (
                  <p className="rounded-xl border border-line bg-white/[0.03] p-4 text-sm text-dim">No study sessions yet.</p>
                )}
                {sessions.map((session) => (
                  <label key={session.id} className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.03] p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={session.completed}
                      disabled={viewOnly}
                      onChange={async () => {
                        const response = await apiFetch(`/study-sessions/${session.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({ completed: !session.completed }),
                        });
                        if (response.ok) await loadSessions();
                      }}
                    />
                    <span className={session.completed ? "text-faint line-through" : "text-fg"}>{session.title}</span>
                  </label>
                ))}
              </div>
            </section>
          </aside>
        </div>
      )}

      {sharing && task && <ShareModal task={task} apiFetch={apiFetch} onClose={() => setSharing(false)} />}
      {dialog}
    </AppShell>
  );
}
