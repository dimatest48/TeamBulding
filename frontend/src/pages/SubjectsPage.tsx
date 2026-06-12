import { useEffect, useState } from "react";
import { LayoutGroup } from "framer-motion";
import { UserButton } from "@clerk/clerk-react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { SubjectsPanel } from "../components/SubjectsPanel";
import { QuickAddModal } from "../components/QuickAddModal";
import { useWorkspaceData } from "../lib/useWorkspaceData";
import { DEFAULT_SUBJECT_COLOR, PALETTE } from "../lib/tasks";
import { SkeletonSubjects } from "../components/SkeletonSubjects";

const ORB_ID = "hero-orb-subjects";

export function SubjectsPage() {
  const { apiFetch, subjects, tasks, loading, load } = useWorkspaceData();
  const [composing, setComposing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const wantNew = searchParams.get("new") !== null;
  const hasSubjects = subjects.length > 0;

  useEffect(() => {
    if (!wantNew) return;
    setComposing(true);
    const next = new URLSearchParams(searchParams);
    next.delete("new");
    setSearchParams(next, { replace: true });
  }, [wantNew, searchParams, setSearchParams]);

  const createSubject = async (name: string, color: string) => {
    const response = await apiFetch("/subjects", { method: "POST", body: JSON.stringify({ name, color }) });
    if (response.ok) await load();
  };

  return (
    <AppShell>
      <LayoutGroup>
        <PageHeader
          eyebrow="Workspace"
          title="Subjects"
          showOrb={hasSubjects}
          orbId={ORB_ID}
          actions={<UserButton afterSignOutUrl="/" />}
        />
        {hasSubjects ? (
          <SubjectsPanel
            subjects={subjects}
            tasks={tasks}
            onCreateSubject={createSubject}
            onRenameSubject={async (id, name) => {
              const response = await apiFetch(`/subjects/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
              if (response.ok) await load();
            }}
            onDeleteSubject={async (id) => {
              const subject = subjects.find((item) => item.id === id);
              const count = tasks.filter((task) => task.subject_id === id).length;
              const message =
                count > 0
                  ? `Delete ${subject?.name || "this subject"}? It has ${count} linked task${count === 1 ? "" : "s"}.`
                  : `Delete ${subject?.name || "this subject"}?`;
              if (!window.confirm(message)) return;
              const response = await apiFetch(`/subjects/${id}`, { method: "DELETE" });
              if (response.ok) await load();
            }}
          />
        ) : loading ? (
          <SkeletonSubjects />
        ) : (
          <EmptyState
            orbId={ORB_ID}
            title="No subjects yet"
            subtitle="Group your tasks by class so every assignment has a home."
            actionLabel="Create subject"
            onAction={() => setComposing(true)}
          />
        )}
      </LayoutGroup>
      {composing && (
        <QuickAddModal
          title="New subject"
          placeholder="e.g. Software Engineering"
          actionLabel="Create subject"
          onSubmit={(name) => createSubject(name, PALETTE[subjects.length % PALETTE.length] || DEFAULT_SUBJECT_COLOR)}
          onClose={() => setComposing(false)}
        />
      )}
    </AppShell>
  );
}
