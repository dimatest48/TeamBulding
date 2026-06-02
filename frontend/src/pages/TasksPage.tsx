import { useEffect, useState } from "react";
import { LayoutGroup } from "framer-motion";
import { UserButton } from "@clerk/clerk-react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { TaskList } from "../components/TaskList";
import { QuickAddModal } from "../components/QuickAddModal";
import { useWorkspaceData } from "../lib/useWorkspaceData";

const ORB_ID = "hero-orb-tasks";

export function TasksPage() {
  const { apiFetch, subjects, tasks, loading, load } = useWorkspaceData();
  const [composing, setComposing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const wantNew = searchParams.get("new") !== null;
  const hasTasks = tasks.length > 0;

  // Arriving from the dashboard "Create task" button: open the composer (empty)
  // or focus the inline form (non-empty), then clear the flag from the URL.
  useEffect(() => {
    if (!wantNew || loading) return;
    if (tasks.length === 0) setComposing(true);
    const next = new URLSearchParams(searchParams);
    next.delete("new");
    setSearchParams(next, { replace: true });
  }, [wantNew, loading, tasks.length, searchParams, setSearchParams]);

  const createTask = async (title: string) => {
    const response = await apiFetch("/tasks", {
      method: "POST",
      body: JSON.stringify({ title, priority: "medium" }),
    });
    if (response.ok) await load();
  };

  return (
    <AppShell>
      <LayoutGroup>
        <PageHeader
          eyebrow="Workspace"
          title="Tasks"
          showOrb={hasTasks}
          orbId={ORB_ID}
          actions={<UserButton afterSignOutUrl="/" />}
        />
        {hasTasks ? (
          <TaskList tasks={tasks} subjects={subjects} apiFetch={apiFetch} reload={load} autoFocusNew={wantNew} />
        ) : loading ? (
          <div className="grid min-h-[40vh] place-items-center text-sm text-dim">Loading…</div>
        ) : (
          <EmptyState
            orbId={ORB_ID}
            title="No tasks yet"
            subtitle="Capture everything you need to do and stay ahead of every deadline."
            actionLabel="Create task"
            onAction={() => setComposing(true)}
          />
        )}
      </LayoutGroup>
      {composing && (
        <QuickAddModal
          title="New task"
          placeholder="What do you need to do?"
          actionLabel="Create task"
          onSubmit={createTask}
          onClose={() => setComposing(false)}
        />
      )}
    </AppShell>
  );
}
