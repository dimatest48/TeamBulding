import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Folders,
  LayoutDashboard,
  Image as ImageIcon,
  ListFilter,
  ListTodo,
  LogOut,
  Maximize2,
  Pencil,
  Plus,
  Search,
  Share2,
  Sparkles,
  Target,
  Trash2,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/clerk-react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=70";

type Subject = {
  id: number;
  name: string;
  color: string;
  task_count: number;
  role: "owner" | "editor" | "viewer";
  shared: boolean;
};
type Priority = "low" | "medium" | "high";
type Task = {
  id: number;
  title: string;
  notes: string | null;
  priority: Priority;
  due_date: string | null;
  completed: boolean;
  subject_id: number | null;
  owner_id: number;
};
type Invite = {
  id: number;
  subject_id: number;
  subject_name: string;
  email: string;
  role: "editor" | "viewer";
  status: string;
  token: string;
  expires_at: string;
};
type Member = { id: number; user_id: number; email: string; name: string; role: Subject["role"] };
type StudySession = {
  id: number;
  task_id: number;
  title: string;
  planned_for: string | null;
  completed: boolean;
};
type TaskAttachment = {
  id: number;
  task_id: number;
  filename: string;
  mime_type: string;
  data_url: string;
};
type UserRead = { id: number; name: string; email: string; onboarding_completed: boolean };
type StatusFilter = "all" | "active" | "completed" | "overdue" | "week";

const PALETTE = ["#6366f1", "#e8a531", "#6f9b6e", "#e0573e", "#2f7c89", "#8b5cf6"];
const todayInput = () => new Date().toISOString().slice(0, 10);
const DEFAULT_SUBJECT_COLOR = "#6366f1";

function useApi() {
  const { getToken } = useAuth();
  return useCallback(
    async (path: string, init: RequestInit = {}) => {
      const token = await getToken();
      const headers = new Headers(init.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      return fetch(`${API_URL}${path}`, { ...init, headers });
    },
    [getToken],
  );
}

function dateOnly(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function normalizeTaskText(value: string | null | undefined) {
  return (value || "")
    .trim()
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function taskDuplicateKey(task: Pick<Task, "title" | "notes" | "subject_id">) {
  return [
    normalizeTaskText(task.title),
    normalizeTaskText(task.notes),
    task.subject_id ?? "none",
  ].join("|");
}

function dedupeTasks(tasks: Task[]) {
  const byKey = new Map<string, Task>();
  for (const task of tasks) {
    const key = taskDuplicateKey(task);
    const existing = byKey.get(key);
    if (!existing || task.id > existing.id) byKey.set(key, task);
  }
  return Array.from(byKey.values());
}

function isOverdue(task: Task) {
  return Boolean(task.due_date && !task.completed && dateOnly(task.due_date) < todayInput());
}

function isDueThisWeek(task: Task) {
  if (!task.due_date) return false;
  const due = new Date(dateOnly(task.due_date));
  const now = new Date(todayInput());
  const end = new Date(now);
  end.setDate(now.getDate() + 7);
  return due >= now && due <= end;
}

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-on-ink">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[860px] bg-cover bg-center opacity-60"
        style={{ backgroundImage: `url("${HERO_PHOTO}")` }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[860px] bg-gradient-to-b from-ink/70 via-ink/85 to-ink" />
      <nav className="relative mx-auto flex max-w-[1180px] items-center justify-between px-5 py-6 sm:px-10">
        <Link className="flex items-center gap-2.5 font-display text-lg font-semibold text-paper" to="/">
          <BookOpen size={22} /> Tasker
        </Link>
        <SignedOut>
          <div className="flex items-center gap-3">
            <SignInButton mode="modal" forceRedirectUrl="/cabinet">
              <button className="font-medium text-on-ink-dim transition hover:text-paper">Log in</button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/cabinet">
              <button className="btn-ghost">Get started</button>
            </SignUpButton>
          </div>
        </SignedOut>
        <SignedIn>
          <div className="flex items-center gap-3">
            <Link className="btn-ghost" to="/cabinet">Open cabinet</Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
      </nav>

      <section className="relative mx-auto grid max-w-[1180px] items-center gap-12 px-5 pb-24 pt-10 sm:px-10 md:grid-cols-[1.05fr_0.95fr] md:gap-20">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-amber">
            Clerk auth, shared study planning
          </p>
          <h1 className="mb-5 text-4xl font-semibold leading-[1.04] text-paper sm:text-5xl md:text-6xl">
            Every subject, deadline, and group project in one calm cabinet.
          </h1>
          <p className="mb-8 max-w-[30em] text-lg leading-relaxed text-on-ink-dim">
            Plan deadlines, invite classmates, and break big assignments into focused study sessions.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <SignedOut>
              <SignUpButton mode="modal" forceRedirectUrl="/cabinet">
                <button className="btn-primary"><Sparkles size={18} /> Create your cabinet</button>
              </SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl="/cabinet">
                <button className="btn-secondary">I already have one</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link className="btn-primary" to="/cabinet"><LayoutDashboard size={18} /> Go to cabinet</Link>
            </SignedIn>
          </div>
        </div>

        <div className="relative rounded-[22px] bg-cloud p-5 text-ink_text shadow-soft" aria-label="App preview">
          <div className="mb-4 flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber" />
            <span className="h-2.5 w-2.5 rounded-full bg-sage" />
          </div>
          {["3 tasks due this week", "Software Engineering shared with 4 classmates", "Exam prep split into 5 study sessions"].map((t) => (
            <div key={t} className="mb-3.5 flex items-center gap-3 rounded-xl bg-paper px-3.5 py-3">
              <CheckCircle2 className="shrink-0 text-sage" />
              <strong className="block text-sm">{t}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="grid min-h-screen place-items-center bg-paper">Loading...</div>;
  if (!isSignedIn) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function Sidebar({ active }: { active: "cabinet" | "profile" }) {
  const { signOut } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Student";

  return (
    <aside className="bg-ink px-5 py-6 text-on-ink md:min-h-screen">
      <Link className="mb-10 flex items-center gap-2.5 font-display text-xl font-semibold text-paper" to="/">
        <BookOpen size={24} /> Tasker
      </Link>
      <div className="mb-8 flex items-center gap-3 rounded-2xl bg-white/8 p-3">
        <UserButton afterSignOutUrl="/" />
        <div className="min-w-0">
          <strong className="block truncate text-sm text-paper">{displayName}</strong>
          <span className="block truncate text-xs text-on-ink-dim">{user?.primaryEmailAddress?.emailAddress}</span>
        </div>
      </div>
      <nav className="flex flex-col gap-2">
        <Link className={`rounded-xl px-4 py-3 font-semibold ${active === "cabinet" ? "bg-white/12 text-paper" : "text-on-ink-dim hover:bg-white/8"}`} to="/cabinet">
          <LayoutDashboard className="mr-2 inline" size={18} /> Cabinet
        </Link>
        <Link className={`rounded-xl px-4 py-3 font-semibold ${active === "profile" ? "bg-white/12 text-paper" : "text-on-ink-dim hover:bg-white/8"}`} to="/profile">
          <UserIcon className="mr-2 inline" size={18} /> Profile
        </Link>
        <button type="button" className="mt-4 rounded-xl px-4 py-3 text-left font-semibold text-on-ink-dim hover:bg-white/8" onClick={() => signOut(() => navigate("/"))}>
          <LogOut className="mr-2 inline" size={18} /> Log out
        </button>
      </nav>
    </aside>
  );
}

function useWorkspaceData() {
  const apiFetch = useApi();
  const { user } = useUser();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [me, setMe] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [sRes, tRes, iRes, meRes] = await Promise.all([
        apiFetch("/subjects"),
        apiFetch("/tasks"),
        apiFetch("/invites"),
        apiFetch("/users/me"),
      ]);
      if (sRes.ok) setSubjects(await sRes.json());
      if (tRes.ok) setTasks(dedupeTasks(await tRes.json()));
      if (iRes.ok) setInvites(await iRes.json());
      if (meRes.ok) setMe(await meRes.json());
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress;
    const name = user?.fullName || user?.firstName || email;
    if (!email || !name) return;
    apiFetch("/users/me/sync", {
      method: "POST",
      body: JSON.stringify({ email, name }),
    }).finally(load);
  }, [apiFetch, load, user?.firstName, user?.fullName, user?.primaryEmailAddress?.emailAddress]);

  return { apiFetch, subjects, tasks, invites, me, loading, load };
}

function DashboardCards({ tasks, subjects }: { tasks: Task[]; subjects: Subject[] }) {
  const completed = tasks.filter((task) => task.completed).length;
  const overdue = tasks.filter(isOverdue).length;
  const week = tasks.filter(isDueThisWeek).length;
  const completion = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const busiest = subjects
    .map((subject) => ({ subject, count: tasks.filter((task) => task.subject_id === subject.id && !task.completed).length }))
    .sort((a, b) => b.count - a.count)[0];

  return (
    <div className="mb-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {[
        ["Active", tasks.length - completed, ListTodo, "bg-[#6366f1]/15 text-[#6366f1]"],
        ["Due this week", week, CalendarDays, "bg-amber/20 text-amber-deep"],
        ["Overdue", overdue, Clock3, "bg-rose/15 text-[#b23a25]"],
        ["Complete", `${completion}%`, CheckCircle2, "bg-sage/20 text-[#4f7a4e]"],
        ["Focus", busiest?.subject.name || "None", Target, "bg-[#2f7c89]/15 text-[#2f7c89]"],
      ].map(([label, value, Icon, tint]) => {
        const I = Icon as React.ComponentType<{ size?: number; className?: string }>;
        return (
          <div key={label as string} className="card flex min-h-[108px] items-center gap-4">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tint as string}`}><I size={22} /></div>
            <div className="min-w-0">
              <strong className="block truncate text-2xl">{value as string | number}</strong>
              <span className="text-sm text-dim">{label as string}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OnboardingPanel({
  me,
  subjects,
  onCreateSubject,
  onComplete,
}: {
  me: UserRead | null;
  subjects: Subject[];
  onCreateSubject: (name: string, color: string) => Promise<void>;
  onComplete: () => Promise<void>;
}) {
  const [subjectName, setSubjectName] = useState("");
  const [goal, setGoal] = useState("Finish the week with no overdue tasks");
  if (!me || me.onboarding_completed) return null;

  return (
    <section className="card mb-9 border-amber/40 bg-[#fff8e8]">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="eyebrow">First setup</p>
          <h2 className="mt-1 text-2xl">Build your study cabinet</h2>
          <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-dim">
            Add your first subjects and choose a semester goal. You can change everything later.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <span key={subject.id} className="rounded-full bg-cloud px-3 py-1 text-sm font-semibold">
                {subject.name}
              </span>
            ))}
          </div>
        </div>
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (subjectName.trim()) {
              await onCreateSubject(subjectName.trim(), PALETTE[subjects.length % PALETTE.length]);
              setSubjectName("");
            } else {
              await onComplete();
            }
          }}
        >
          <input className="field" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="Add a subject" />
          <input className="field" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Semester goal" />
          <div className="flex gap-2">
            <button className="btn-primary flex-1" type="submit"><Plus size={18} /> Add</button>
            <button className="btn-outline flex-1" type="button" onClick={onComplete}>Done</button>
          </div>
        </form>
      </div>
    </section>
  );
}

function TaskList({
  tasks,
  subjects,
  apiFetch,
  reload,
  subjectScope,
}: {
  tasks: Task[];
  subjects: Subject[];
  apiFetch: ReturnType<typeof useApi>;
  reload: () => Promise<void>;
  subjectScope?: number;
}) {
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
        <div className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2 text-sm text-dim">
          <ListFilter size={17} /> {visibleTasks.length} shown
        </div>
      </div>

      <form onSubmit={addTask} className="mb-5 grid gap-3 xl:grid-cols-[1fr_180px_140px_150px_auto]">
        <input className="field m-0" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="New task" />
        <select className="field m-0" value={newTaskSubject} onChange={(e) => setNewTaskSubject(e.target.value)}>
          <option value="">No subject</option>
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
        </select>
        <select className="field m-0" value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as Priority)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input className="field m-0" type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
        <button className="btn-primary px-4" type="submit" aria-label="Add task"><Plus size={18} /></button>
        <textarea className="field xl:col-span-5" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Notes for this task" rows={2} />
      </form>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_160px_150px_150px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" size={17} />
          <input className="field m-0 pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks" />
        </label>
        <select className="field m-0" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} disabled={Boolean(subjectScope)}>
          <option value="all">All subjects</option>
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
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
        {visibleTasks.length === 0 && <p className="rounded-xl bg-paper px-4 py-8 text-center text-dim">No tasks match this view.</p>}
        {visibleTasks.map((task) => {
          const subject = subjects.find((s) => s.id === task.subject_id);
          const expanded = expandedTask === task.id;
          return (
            <article key={task.id} className="rounded-xl bg-paper p-3.5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateTask(task, { completed: !task.completed })}
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${task.completed ? "border-sage bg-sage text-white" : "border-paper-2"}`}
                  aria-label="Toggle task"
                >
                  {task.completed && <CheckCircle2 size={18} />}
                </button>
                <div className="min-w-0 flex-1">
                  <Link className={`block truncate font-semibold hover:text-amber-deep ${task.completed ? "text-dim line-through" : ""}`} to={`/tasks/${task.id}`}>
                    {task.title}
                  </Link>
                  <span className="text-xs capitalize text-dim">
                    {task.priority} priority{subject ? ` · ${subject.name}` : ""}{task.due_date ? ` · due ${dateOnly(task.due_date)}` : ""}
                  </span>
                </div>
                {subject?.shared && <span className="rounded-full bg-cloud px-2.5 py-1 text-xs font-semibold text-dim">Shared</span>}
                {isOverdue(task) && <span className="rounded-full bg-rose/10 px-2.5 py-1 text-xs font-semibold text-[#b23a25]">Overdue</span>}
                <button type="button" onClick={async () => {
                  const next = expanded ? null : task.id;
                  setExpandedTask(next);
                  if (next) await loadSessions(task.id);
                }} className="icon-btn" aria-label="Study planner"><ChevronDown className={`transition ${expanded ? "rotate-180" : ""}`} size={17} /></button>
                <button type="button" onClick={() => startEditing(task)} className="icon-btn" aria-label="Edit task"><Pencil size={17} /></button>
                <button type="button" onClick={async () => {
                  if (window.confirm("Delete this task?")) {
                    const response = await apiFetch(`/tasks/${task.id}`, { method: "DELETE" });
                    if (response.ok) await reload();
                  }
                }} className="icon-btn text-dim hover:bg-rose/10 hover:text-[#b23a25]" aria-label="Delete task"><Trash2 size={17} /></button>
              </div>

              {expanded && (
                <div className="mt-4 border-t border-paper-2 pt-4">
                  {editingTask === task.id ? (
                    <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_160px_140px_150px]">
                      <input className="field m-0" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Task title" />
                      <select className="field m-0" value={editSubject} onChange={(e) => setEditSubject(e.target.value)}>
                        <option value="">No subject</option>
                        {subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                      <select className="field m-0" value={editPriority} onChange={(e) => setEditPriority(e.target.value as Priority)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <input className="field m-0" type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                      <textarea className="field lg:col-span-4" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Task notes" rows={2} />
                      <div className="flex gap-2 lg:col-span-4">
                        <button className="btn-primary px-4 py-2" type="button" onClick={() => submitTaskEdit(task)}>Save changes</button>
                        <button className="btn-outline px-4 py-2" type="button" onClick={() => setEditingTask(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className="mb-4 rounded-xl bg-cloud p-3 text-sm text-dim">
                      {task.notes || "No notes yet."}
                    </p>
                  )}
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input className="field m-0" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} placeholder="Break into a study session" />
                    <button className="btn-primary px-4" type="button" onClick={() => addSession(task.id)}><Plus size={18} /> Session</button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {(sessions[task.id] || []).map((session) => (
                      <label key={session.id} className="flex items-center gap-3 rounded-lg bg-cloud px-3 py-2 text-sm">
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
                        <span className={session.completed ? "text-dim line-through" : ""}>{session.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SubjectsPanel({
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
      <form onSubmit={async (event) => {
        event.preventDefault();
        if (!newSubject.trim()) return;
        await onCreateSubject(newSubject.trim(), DEFAULT_SUBJECT_COLOR);
        setNewSubject("");
      }} className="mb-5 grid gap-3">
        <input className="field" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Subject name" />
        <button className="btn-primary w-full" type="submit"><Plus size={18} /> Add subject</button>
      </form>
      <div className="space-y-2">
        {subjects.map((subject) => {
          const subjectTasks = tasks.filter((task) => task.subject_id === subject.id);
          const completed = subjectTasks.filter((task) => task.completed).length;
          const progress = subjectTasks.length ? Math.round((completed / subjectTasks.length) * 100) : 0;
          const isOpen = openSubject === subject.id;
          const initials = subject.name.slice(0, 2).toUpperCase();

          return (
            <article key={subject.id} className="rounded-xl bg-paper p-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOpenSubject(isOpen ? null : subject.id)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cloud font-display text-sm font-semibold text-ink shadow-soft-sm"
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
                      <button className="btn-primary px-3 py-2 text-sm" type="submit">Save</button>
                      <button className="btn-outline px-3 py-2 text-sm" type="button" onClick={() => setEditingSubject(null)}>Cancel</button>
                    </form>
                  ) : (
                    <Link to={`/subjects/${subject.id}`}>
                      <strong className="block truncate text-sm">{subject.name}</strong>
                      <span className="text-xs text-dim">{subjectTasks.length} tasks · {progress}% complete</span>
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
                    <button type="button" onClick={() => onDeleteSubject(subject.id)} className="icon-btn text-dim hover:bg-rose/10 hover:text-[#b23a25]" aria-label="Delete subject"><Trash2 size={16} /></button>
                  </>
                )}
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-cloud">
                <div className="h-full rounded-full bg-amber transition-all" style={{ width: `${progress}%` }} />
              </div>

              {isOpen && (
                <div className="mt-3 space-y-2 border-t border-paper-2 pt-3">
                  {subjectTasks.length === 0 && <p className="text-sm text-dim">No tasks in this subject yet.</p>}
                  {subjectTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 rounded-lg bg-cloud px-3 py-2 text-sm">
                      <CheckCircle2 className={task.completed ? "text-sage" : "text-dim/40"} size={16} />
                      <div className="min-w-0 flex-1">
                        <span className={`block truncate ${task.completed ? "text-dim line-through" : ""}`}>{task.title}</span>
                        <span className="text-xs capitalize text-dim">
                          {task.priority}{task.due_date ? ` · ${dateOnly(task.due_date)}` : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function InvitationsPanel({ invites, apiFetch, reload }: { invites: Invite[]; apiFetch: ReturnType<typeof useApi>; reload: () => Promise<void> }) {
  if (invites.length === 0) return null;
  return (
    <section className="card mb-6 border-[#2f7c89]/30 bg-[#edf7f8]">
      <h2 className="mb-4 flex items-center gap-2 text-2xl"><Users size={22} /> Invitations</h2>
      <div className="space-y-2">
        {invites.map((invite) => (
          <div key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cloud p-3">
            <div>
              <strong>{invite.subject_name}</strong>
              <p className="text-sm text-dim">Role: {invite.role}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary px-4 py-2" type="button" onClick={async () => {
                const response = await apiFetch(`/invites/${invite.token}/accept`, { method: "POST" });
                if (response.ok) await reload();
              }}>Accept</button>
              <button className="btn-outline px-4 py-2" type="button" onClick={async () => {
                const response = await apiFetch(`/invites/${invite.token}/decline`, { method: "POST" });
                if (response.ok) await reload();
              }}>Decline</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CabinetPage() {
  const { user } = useUser();
  const { apiFetch, subjects, tasks, invites, me, loading, load } = useWorkspaceData();
  const [searchParams, setSearchParams] = useSearchParams();
  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || "there";

  useEffect(() => {
    const token = searchParams.get("invite");
    if (!token) return;
    apiFetch(`/invites/${token}/accept`, { method: "POST" }).finally(async () => {
      setSearchParams({});
      await load();
    });
  }, [apiFetch, load, searchParams, setSearchParams]);

  const createSubject = async (name: string, color: string) => {
    const response = await apiFetch("/subjects", { method: "POST", body: JSON.stringify({ name, color }) });
    if (response.ok) await load();
  };

  return (
    <div className="grid min-h-screen md:grid-cols-[264px_1fr]">
      <Sidebar active="cabinet" />
      <section className="bg-paper p-6 sm:p-12">
        <header className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Your private cabinet</p>
            <h1 className="text-3xl sm:text-4xl">Hi, {firstName}</h1>
          </div>
          <UserButton afterSignOutUrl="/" />
        </header>

        <OnboardingPanel
          me={me}
          subjects={subjects}
          onCreateSubject={createSubject}
          onComplete={async () => {
            const response = await apiFetch("/users/me/complete-onboarding", { method: "POST" });
            if (response.ok) await load();
          }}
        />
        <InvitationsPanel invites={invites} apiFetch={apiFetch} reload={load} />
        <DashboardCards tasks={tasks} subjects={subjects} />

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <TaskList tasks={tasks} subjects={subjects} apiFetch={apiFetch} reload={load} />
          <SubjectsPanel
            subjects={subjects}
            tasks={tasks}
            onCreateSubject={createSubject}
            onRenameSubject={async (id, name) => {
              const response = await apiFetch(`/subjects/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ name }),
              });
              if (response.ok) await load();
            }}
            onDeleteSubject={async (id) => {
              const subject = subjects.find((item) => item.id === id);
              const count = tasks.filter((task) => task.subject_id === id).length;
              const message = count > 0
                ? `Delete ${subject?.name || "this subject"}? It has ${count} linked task${count === 1 ? "" : "s"}.`
                : `Delete ${subject?.name || "this subject"}?`;
              if (!window.confirm(message)) return;
              const response = await apiFetch(`/subjects/${id}`, { method: "DELETE" });
              if (response.ok) await load();
            }}
          />
        </div>
        {loading && <p className="mt-4 text-sm text-dim">Loading...</p>}
      </section>
    </div>
  );
}

function SubjectPage() {
  const { subjectId } = useParams();
  const id = Number(subjectId);
  const { apiFetch, subjects, tasks, loading, load } = useWorkspaceData();
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [inviteLink, setInviteLink] = useState("");
  const subject = subjects.find((item) => item.id === id);
  const scopedTasks = tasks.filter((task) => task.subject_id === id);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/subjects/${id}/members`).then(async (response) => {
      if (response.ok) setMembers(await response.json());
    });
  }, [apiFetch, id, subjects.length]);

  return (
    <div className="grid min-h-screen md:grid-cols-[264px_1fr]">
      <Sidebar active="cabinet" />
      <section className="bg-paper p-6 sm:p-12">
        <header className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link className="text-sm font-semibold text-dim hover:text-ink" to="/cabinet">Back to cabinet</Link>
            <h1 className="mt-2 text-3xl sm:text-4xl">{subject?.name || "Subject"}</h1>
            <p className="mt-2 text-sm text-dim">{scopedTasks.length} tasks · {subject?.role || "viewer"}</p>
          </div>
          <UserButton afterSignOutUrl="/" />
        </header>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="card"><strong className="block text-2xl">{scopedTasks.filter((t) => !t.completed).length}</strong><span className="text-sm text-dim">Active</span></div>
          <div className="card"><strong className="block text-2xl">{scopedTasks.filter(isDueThisWeek).length}</strong><span className="text-sm text-dim">This week</span></div>
          <div className="card"><strong className="block text-2xl">{scopedTasks.filter(isOverdue).length}</strong><span className="text-sm text-dim">Overdue</span></div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <TaskList tasks={tasks} subjects={subjects} apiFetch={apiFetch} reload={load} subjectScope={id} />
          <section className="card">
            <h2 className="mb-5 flex items-center gap-2 text-2xl"><Share2 size={21} /> Group project</h2>
            {subject?.role === "owner" ? (
              <form className="mb-5 space-y-3" onSubmit={async (event) => {
                event.preventDefault();
                const response = await apiFetch(`/subjects/${id}/invites`, {
                  method: "POST",
                  body: JSON.stringify({ email, role }),
                });
                if (response.ok) {
                  const invite = (await response.json()) as Invite;
                  setInviteLink(`${window.location.origin}/cabinet?invite=${invite.token}`);
                  setEmail("");
                  await load();
                }
              }}>
                <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@email.com" />
                <select className="field" value={role} onChange={(e) => setRole(e.target.value as "editor" | "viewer")}>
                  <option value="editor">Can edit</option>
                  <option value="viewer">Can view</option>
                </select>
                <button className="btn-primary w-full" type="submit"><Share2 size={18} /> Invite</button>
                {inviteLink && <p className="rounded-xl bg-paper p-3 text-xs text-dim break-all">Invite created: {inviteLink}</p>}
              </form>
            ) : (
              <p className="mb-5 rounded-xl bg-paper p-4 text-sm text-dim">Only the owner can invite new members.</p>
            )}

            <h3 className="mb-3 font-semibold">Members</h3>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={`${member.role}-${member.user_id}`} className="rounded-xl bg-paper p-3">
                  <strong className="block truncate text-sm">{member.name}</strong>
                  <span className="text-xs text-dim">{member.email} · {member.role}</span>
                </div>
              ))}
              {!loading && members.length === 0 && <p className="text-sm text-dim">No members loaded yet.</p>}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function TaskDetailPage() {
  const { taskId } = useParams();
  const id = Number(taskId);
  const navigate = useNavigate();
  const { apiFetch, subjects, tasks, load } = useWorkspaceData();
  const task = tasks.find((item) => item.id === id);
  const subject = subjects.find((item) => item.id === task?.subject_id);
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
    <div className="grid min-h-screen md:grid-cols-[264px_1fr]">
      <Sidebar active="cabinet" />
      <section className="bg-paper p-6 sm:p-12">
        <header className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link className="text-sm font-semibold text-dim hover:text-ink" to="/cabinet">Back to cabinet</Link>
            <h1 className="mt-2 text-3xl sm:text-4xl">{task?.title || "Task details"}</h1>
            <p className="mt-2 text-sm text-dim">{subject?.name || "No subject"}{task?.due_date ? ` · due ${dateOnly(task.due_date)}` : ""}</p>
          </div>
          <UserButton afterSignOutUrl="/" />
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
              </div>
              {screenshotHelp && (
                <div className="rounded-xl border border-amber/30 bg-[#fff8e8] p-4 text-sm text-dim">
                  Press <strong className="text-ink">Cmd + Ctrl + Shift + 4</strong>, select an area, then press{" "}
                  <strong className="text-ink">Cmd + V</strong> inside the draft. You can also drag an image into Visual notes.
                </div>
              )}
              <textarea
                ref={draftRef}
                className="field min-h-[300px] text-base leading-relaxed"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onPaste={handleDraftPaste}
                placeholder="Write notes for this task. Use macOS screenshot to clipboard, then paste here."
              />
              <div
                className="rounded-xl border border-dashed border-paper-2 bg-paper p-4 transition hover:border-amber/60"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleImageDrop}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-dim">
                    <ImageIcon size={18} /> Visual notes
                  </div>
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
                </div>
                {attachments.length === 0 ? (
                  <div className="grid min-h-[140px] place-items-center rounded-xl bg-cloud px-5 py-8 text-center">
                    <p className="max-w-[36ch] text-sm text-dim">
                      Paste a screenshot with <strong className="text-ink">Cmd + V</strong>, drag an image here, or add an image file.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {attachments.map((attachment) => (
                      <figure key={attachment.id} className="overflow-hidden rounded-xl bg-cloud">
                        <button
                          type="button"
                          className="block w-full bg-paper"
                          onClick={() => setPreviewImage(attachment)}
                          aria-label={`Open ${attachment.filename}`}
                        >
                          <img className="max-h-[260px] w-full object-contain" src={attachment.data_url} alt={attachment.filename} />
                        </button>
                        <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-dim">
                          <span className="truncate">{attachment.filename}</span>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              className="grid h-7 w-7 place-items-center rounded-full hover:bg-paper hover:text-ink"
                              type="button"
                              aria-label="Preview image"
                              onClick={() => setPreviewImage(attachment)}
                            >
                              <Maximize2 size={15} />
                            </button>
                            <a
                              className="rounded-full px-2 py-1 font-semibold hover:bg-paper hover:text-ink"
                              href={attachment.data_url}
                              download={attachment.filename}
                            >
                              Download
                            </a>
                            <button
                              className="grid h-7 w-7 place-items-center rounded-full hover:bg-rose/10 hover:text-[#b23a25]"
                              type="button"
                              aria-label="Delete image"
                              onClick={async () => {
                                const response = await apiFetch(`/task-attachments/${attachment.id}`, { method: "DELETE" });
                                if (response.ok) await loadAttachments();
                              }}
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {previewImage && (
              <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4" role="dialog" aria-modal="true">
                <div className="max-h-[92vh] w-full max-w-[1100px] overflow-hidden rounded-card bg-cloud shadow-soft">
                  <div className="flex items-center justify-between gap-3 border-b border-paper-2 px-4 py-3">
                    <strong className="truncate text-sm">{previewImage.filename}</strong>
                    <div className="flex items-center gap-2">
                      <a className="btn-outline px-4 py-2 text-sm" href={previewImage.data_url} download={previewImage.filename}>
                        Download
                      </a>
                      <button className="icon-btn" type="button" onClick={() => setPreviewImage(null)} aria-label="Close preview">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[82vh] overflow-auto bg-paper p-4">
                    <img className="mx-auto max-w-none" src={previewImage.data_url} alt={previewImage.filename} />
                  </div>
                </div>
              </div>
            )}

            <aside className="space-y-6">
            <form className="card space-y-4" onSubmit={saveTask}>
              <h2 className="text-2xl">Task settings</h2>
              <label className="block">
                <span className="text-sm font-semibold text-dim">Title</span>
                <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-dim">Subject</span>
                <select className="field" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                  <option value="">No subject</option>
                  {subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <label className="block">
                  <span className="text-sm font-semibold text-dim">Priority</span>
                  <select className="field" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-dim">Due date</span>
                  <input className="field" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </label>
              </div>
              <div className="grid gap-3">
                <button className="btn-primary w-full" type="submit">Save settings</button>
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
                <button
                  className="btn-outline w-full text-[#b23a25]"
                  type="button"
                  onClick={async () => {
                    if (!window.confirm("Delete this task?")) return;
                    const response = await apiFetch(`/tasks/${task.id}`, { method: "DELETE" });
                    if (response.ok) navigate("/cabinet");
                  }}
                >
                  Delete task
                </button>
              </div>
            </form>

            <section className="card">
              <h2 className="mb-5 text-2xl">Study sessions</h2>
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
              <div className="space-y-2">
                {sessions.length === 0 && <p className="rounded-xl bg-paper p-4 text-sm text-dim">No study sessions yet.</p>}
                {sessions.map((session) => (
                  <label key={session.id} className="flex items-center gap-3 rounded-xl bg-paper p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={session.completed}
                      onChange={async () => {
                        const response = await apiFetch(`/study-sessions/${session.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({ completed: !session.completed }),
                        });
                        if (response.ok) await loadSessions();
                      }}
                    />
                    <span className={session.completed ? "text-dim line-through" : ""}>{session.title}</span>
                  </label>
                ))}
              </div>
            </section>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}

function ProfilePage() {
  const { user } = useUser();
  return (
    <div className="grid min-h-screen md:grid-cols-[264px_1fr]">
      <Sidebar active="profile" />
      <section className="bg-paper p-6 sm:p-12">
        <div className="card max-w-[620px]">
          <p className="eyebrow">Clerk profile</p>
          <h1 className="mb-5 mt-1 text-3xl">Account</h1>
          <dl className="space-y-4 text-sm">
            <div><dt className="font-semibold text-dim">Name</dt><dd className="text-lg">{user?.fullName || "Not set"}</dd></div>
            <div><dt className="font-semibold text-dim">Email</dt><dd className="text-lg">{user?.primaryEmailAddress?.emailAddress}</dd></div>
            <div><dt className="font-semibold text-dim">Email verification</dt><dd className="text-lg capitalize">{user?.primaryEmailAddress?.verification?.status || "unknown"}</dd></div>
          </dl>
          <div className="mt-6"><UserButton afterSignOutUrl="/" /></div>
        </div>
      </section>
    </div>
  );
}

function SetupMissingPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-6">
      <div className="card max-w-[560px]">
        <h1 className="mb-3 text-3xl">Clerk key needed</h1>
        <p className="text-dim">
          Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> to the project <code>.env</code>,
          then rebuild Docker. Clerk will handle signup, verification, and password reset.
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/cabinet" element={<RequireAuth><CabinetPage /></RequireAuth>} />
        <Route path="/subjects/:subjectId" element={<RequireAuth><SubjectPage /></RequireAuth>} />
        <Route path="/tasks/:taskId" element={<RequireAuth><TaskDetailPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {CLERK_PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <SetupMissingPage />
    )}
  </React.StrictMode>,
);
