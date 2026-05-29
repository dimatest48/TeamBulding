import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen,
  CheckCircle2,
  Folders,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Plus,
  Sparkles,
  Target,
  Trash2,
  User as UserIcon,
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
} from "react-router-dom";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=70";

type Subject = { id: number; name: string; color: string; task_count: number };
type Priority = "low" | "medium" | "high";
type Task = {
  id: number;
  title: string;
  notes: string | null;
  priority: Priority;
  due_date: string | null;
  completed: boolean;
  subject_id: number | null;
};

const PALETTE = ["#6366f1", "#e8a531", "#6f9b6e", "#e0573e", "#2f7c89", "#8b5cf6"];

function useApi() {
  const { getToken } = useAuth();
  return useCallback(
    async (path: string, init: RequestInit = {}) => {
      const token = await getToken();
      const headers = new Headers(init.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      return fetch(`${API_URL}${path}`, { ...init, headers });
    },
    [getToken],
  );
}

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-on-ink">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[860px] bg-cover bg-center opacity-60"
        style={{ backgroundImage: `url("${HERO_PHOTO}")` }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[860px] bg-gradient-to-b from-ink/70 via-ink/85 to-ink"
        aria-hidden="true"
      />
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
            Clerk auth, student task tracking
          </p>
          <h1 className="mb-5 text-4xl font-semibold leading-[1.04] text-paper sm:text-5xl md:text-6xl">
            Every subject, deadline, and task in one calm cabinet.
          </h1>
          <p className="mb-8 max-w-[30em] text-lg leading-relaxed text-on-ink-dim">
            Clerk handles signup, email verification, login, password reset, and sessions.
            Your app stays focused on subjects and tasks.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <SignedOut>
              <SignUpButton mode="modal" forceRedirectUrl="/cabinet">
                <button className="btn-primary">
                  <Sparkles size={18} /> Create your cabinet
                </button>
              </SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl="/cabinet">
                <button className="btn-secondary">I already have one</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link className="btn-primary" to="/cabinet">
                <LayoutDashboard size={18} /> Go to cabinet
              </Link>
            </SignedIn>
          </div>
        </div>

        <div className="relative rounded-[22px] bg-cloud p-5 text-ink_text shadow-soft" aria-label="App preview">
          <div className="mb-4 flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber" />
            <span className="h-2.5 w-2.5 rounded-full bg-sage" />
          </div>
          <div className="mb-3.5 flex items-center gap-3 rounded-xl bg-paper px-3.5 py-3">
            <CheckCircle2 className="shrink-0 text-sage" />
            <div>
              <strong className="block text-sm">3 tasks due this week</strong>
              <small className="text-dim">Programming · History · Mathematics</small>
            </div>
          </div>
          <div className="mb-3.5 rounded-xl bg-paper p-3.5">
            <div className="mb-2 flex justify-between text-sm font-semibold">
              <span>Programming</span>
              <span>65%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-paper-2">
              <div className="h-full rounded-full bg-amber" style={{ width: "65%" }} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {["Email verification by Clerk", "Password reset included", "Tasks in your database"].map((t) => (
              <span key={t} className="rounded-lg border-l-[3px] border-amber bg-paper px-3.5 py-2.5 text-sm">
                {t}
              </span>
            ))}
          </div>
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
          <span className="block truncate text-xs text-on-ink-dim">
            {user?.primaryEmailAddress?.emailAddress}
          </span>
        </div>
      </div>
      <nav className="flex flex-col gap-2">
        <Link className={`rounded-xl px-4 py-3 font-semibold ${active === "cabinet" ? "bg-white/12 text-paper" : "text-on-ink-dim hover:bg-white/8"}`} to="/cabinet">
          <LayoutDashboard className="mr-2 inline" size={18} /> Cabinet
        </Link>
        <Link className={`rounded-xl px-4 py-3 font-semibold ${active === "profile" ? "bg-white/12 text-paper" : "text-on-ink-dim hover:bg-white/8"}`} to="/profile">
          <UserIcon className="mr-2 inline" size={18} /> Profile
        </Link>
        <button
          type="button"
          className="mt-4 rounded-xl px-4 py-3 text-left font-semibold text-on-ink-dim hover:bg-white/8"
          onClick={() => signOut(() => navigate("/"))}
        >
          <LogOut className="mr-2 inline" size={18} /> Log out
        </button>
      </nav>
    </aside>
  );
}

function CabinetPage() {
  const { user } = useUser();
  const apiFetch = useApi();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [newTaskSubject, setNewTaskSubject] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("medium");
  const [newSubject, setNewSubject] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);

  const load = useCallback(async () => {
    try {
      const [sRes, tRes] = await Promise.all([apiFetch("/subjects"), apiFetch("/tasks")]);
      if (sRes.ok) setSubjects(await sRes.json());
      if (tRes.ok) setTasks(await tRes.json());
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const addTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTask.trim()) return;
    const response = await apiFetch("/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: newTask.trim(),
        priority: newTaskPriority,
        subject_id: newTaskSubject ? Number(newTaskSubject) : null,
      }),
    });
    if (response.ok) {
      setNewTask("");
      await load();
    }
  };

  const toggleTask = async (task: Task) => {
    const response = await apiFetch(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: !task.completed }),
    });
    if (response.ok) {
      const updated = (await response.json()) as Task;
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
  };

  const deleteTask = async (id: number) => {
    const response = await apiFetch(`/tasks/${id}`, { method: "DELETE" });
    if (response.ok) await load();
  };

  const addSubject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newSubject.trim()) return;
    const response = await apiFetch("/subjects", {
      method: "POST",
      body: JSON.stringify({ name: newSubject.trim(), color: newColor }),
    });
    if (response.ok) {
      setNewSubject("");
      setNewColor(PALETTE[(subjects.length + 1) % PALETTE.length]);
      await load();
    }
  };

  const deleteSubject = async (id: number) => {
    const response = await apiFetch(`/subjects/${id}`, { method: "DELETE" });
    if (response.ok) await load();
  };

  const completed = tasks.filter((task) => task.completed).length;
  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || "there";

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

        <div className="mb-9 grid gap-4 sm:grid-cols-3">
          {[
            ["Active tasks", tasks.length - completed, ListTodo, "bg-[#6366f1]/15 text-[#6366f1]"],
            ["Completed", completed, CheckCircle2, "bg-sage/20 text-[#4f7a4e]"],
            ["Subjects", subjects.length, Folders, "bg-amber/20 text-amber-deep"],
          ].map(([label, value, Icon, tint]) => {
            const I = Icon as React.ComponentType<{ size?: number; className?: string }>;
            return (
              <div key={label as string} className="card flex items-center gap-4">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${tint as string}`}>
                  <I size={22} />
                </div>
                <div>
                  <strong className="block text-2xl">{value as number}</strong>
                  <span className="text-sm text-dim">{label as string}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="card">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl">Tasks</h2>
              {loading && <span className="text-sm text-dim">Loading...</span>}
            </div>
            <form onSubmit={addTask} className="mb-5 grid gap-3 md:grid-cols-[1fr_150px_130px_auto]">
              <input className="field m-0" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="New task" />
              <select className="field m-0" value={newTaskSubject} onChange={(e) => setNewTaskSubject(e.target.value)}>
                <option value="">No subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
              <select className="field m-0" value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as Priority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button className="btn-primary px-4" type="submit" aria-label="Add task">
                <Plus size={18} />
              </button>
            </form>
            <div className="space-y-3">
              {tasks.length === 0 && !loading && (
                <p className="rounded-xl bg-paper px-4 py-8 text-center text-dim">No tasks yet.</p>
              )}
              {tasks.map((task) => {
                const subject = subjects.find((s) => s.id === task.subject_id);
                return (
                  <article key={task.id} className="flex items-center gap-3 rounded-xl bg-paper p-3.5">
                    <button
                      type="button"
                      onClick={() => toggleTask(task)}
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${task.completed ? "border-sage bg-sage text-white" : "border-paper-2"}`}
                      aria-label="Toggle task"
                    >
                      {task.completed && <CheckCircle2 size={18} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <strong className={`block truncate ${task.completed ? "text-dim line-through" : ""}`}>{task.title}</strong>
                      <span className="text-xs capitalize text-dim">
                        {task.priority} priority{subject ? ` · ${subject.name}` : ""}
                      </span>
                    </div>
                    <button type="button" onClick={() => deleteTask(task.id)} className="rounded-full p-2 text-dim hover:bg-rose/10 hover:text-[#b23a25]" aria-label="Delete task">
                      <Trash2 size={17} />
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="card">
            <h2 className="mb-5 text-2xl">Subjects</h2>
            <form onSubmit={addSubject} className="mb-5 space-y-3">
              <input className="field" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Subject name" />
              <div className="flex flex-wrap gap-2">
                {PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Pick ${color}`}
                    onClick={() => setNewColor(color)}
                    className={`h-8 w-8 rounded-full border-2 ${newColor === color ? "border-ink" : "border-transparent"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button className="btn-primary w-full" type="submit">
                <Plus size={18} /> Add subject
              </button>
            </form>
            <div className="space-y-2">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center gap-3 rounded-xl bg-paper p-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} />
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">{subject.name}</strong>
                    <span className="text-xs text-dim">{subject.task_count} tasks</span>
                  </div>
                  <button type="button" onClick={() => deleteSubject(subject.id)} className="rounded-full p-2 text-dim hover:bg-rose/10 hover:text-[#b23a25]" aria-label="Delete subject">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
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
            <div>
              <dt className="font-semibold text-dim">Name</dt>
              <dd className="text-lg">{user?.fullName || "Not set"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-dim">Email</dt>
              <dd className="text-lg">{user?.primaryEmailAddress?.emailAddress}</dd>
            </div>
            <div>
              <dt className="font-semibold text-dim">Email verification</dt>
              <dd className="text-lg capitalize">{user?.primaryEmailAddress?.verification?.status || "unknown"}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <UserButton afterSignOutUrl="/" />
          </div>
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
