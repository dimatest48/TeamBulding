import { useEffect, useMemo } from "react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { PageHeader } from "../components/PageHeader";
import { OnboardingPanel } from "../components/OnboardingPanel";
import { InvitationsPanel } from "../components/InvitationsPanel";
import { OverduePanel } from "../components/dashboard/OverduePanel";
import { ActiveTasksPanel } from "../components/dashboard/ActiveTasksPanel";
import { FocusPanel } from "../components/dashboard/FocusPanel";
import { DueThisWeekPanel } from "../components/dashboard/DueThisWeekPanel";
import { SubjectsProgressPanel } from "../components/dashboard/SubjectsProgressPanel";
import { useWorkspaceData } from "../lib/useWorkspaceData";
import { isOverdue, sortTasks } from "../lib/tasks";

export function CabinetPage() {
  const { user } = useUser();
  const { apiFetch, subjects, tasks, invites, me, loading, load } = useWorkspaceData();
  const [searchParams, setSearchParams] = useSearchParams();
  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || "there";

  const overdue = useMemo(() => sortTasks(tasks.filter(isOverdue), "due"), [tasks]);

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
    <AppShell>
      <PageHeader eyebrow="Your private cabinet" title={`Hi, ${firstName}`} actions={<UserButton afterSignOutUrl="/" />} />

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

      <OverduePanel tasks={overdue} subjects={subjects} apiFetch={apiFetch} reload={load} />

      <div className="grid items-stretch gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActiveTasksPanel tasks={tasks} subjects={subjects} apiFetch={apiFetch} reload={load} />
        </div>
        <FocusPanel subjects={subjects} tasks={tasks} />
      </div>

      <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-2">
        <DueThisWeekPanel tasks={tasks} subjects={subjects} apiFetch={apiFetch} reload={load} />
        <SubjectsProgressPanel subjects={subjects} tasks={tasks} />
      </div>

      {loading && <p className="mt-4 text-sm text-dim">Loading...</p>}
    </AppShell>
  );
}
