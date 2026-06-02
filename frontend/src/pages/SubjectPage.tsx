import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { EditableTitle } from "../components/EditableTitle";
import { TaskList } from "../components/TaskList";
import { useWorkspaceData } from "../lib/useWorkspaceData";
import { isDueThisWeek, isOverdue } from "../lib/tasks";
import type { Invite, Member } from "../lib/types";

export function SubjectPage() {
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
    <AppShell>
      <header className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link className="text-sm font-semibold text-dim transition hover:text-fg" to="/subjects">
            Back to subjects
          </Link>
          <EditableTitle
            className="mt-2 font-display text-3xl font-semibold sm:text-4xl"
            value={subject?.name || "Subject"}
            editable={subject?.role === "owner"}
            placeholder="Subject"
            onSave={async (name) => {
              const r = await apiFetch(`/subjects/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
              if (r.ok) await load();
            }}
          />
          <p className="mt-2 text-sm text-dim">
            {scopedTasks.length} tasks · {subject?.role || "viewer"}
          </p>
        </div>
        <UserButton afterSignOutUrl="/" />
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <strong className="block text-2xl text-fg">{scopedTasks.filter((t) => !t.completed).length}</strong>
          <span className="text-sm text-dim">Active</span>
        </div>
        <div className="card">
          <strong className="block text-2xl text-fg">{scopedTasks.filter(isDueThisWeek).length}</strong>
          <span className="text-sm text-dim">This week</span>
        </div>
        <div className="card">
          <strong className="block text-2xl text-fg">{scopedTasks.filter(isOverdue).length}</strong>
          <span className="text-sm text-dim">Overdue</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <TaskList tasks={tasks} subjects={subjects} apiFetch={apiFetch} reload={load} subjectScope={id} />
        <section className="card">
          <h2 className="mb-5 flex items-center gap-2 text-2xl">
            <Share2 size={21} /> Group project
          </h2>
          {subject?.role === "owner" ? (
            <form
              className="mb-5 space-y-3"
              onSubmit={async (event) => {
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
              }}
            >
              <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@email.com" />
              <select className="field" value={role} onChange={(e) => setRole(e.target.value as "editor" | "viewer")}>
                <option value="editor">Can edit</option>
                <option value="viewer">Can view</option>
              </select>
              <button className="btn-primary w-full" type="submit">
                <Share2 size={18} /> Invite
              </button>
              {inviteLink && (
                <p className="break-all rounded-xl border border-line bg-white/[0.03] p-3 text-xs text-dim">
                  Invite created: {inviteLink}
                </p>
              )}
            </form>
          ) : (
            <p className="mb-5 rounded-xl border border-line bg-white/[0.03] p-4 text-sm text-dim">
              Only the owner can invite new members.
            </p>
          )}

          <h3 className="mb-3 font-semibold text-fg">Members</h3>
          <div className="space-y-2">
            {members.map((member) => (
              <div key={`${member.role}-${member.user_id}`} className="rounded-xl border border-line bg-white/[0.03] p-3">
                <strong className="block truncate text-sm text-fg">{member.name}</strong>
                <span className="text-xs text-dim">
                  {member.email} · {member.role}
                </span>
              </div>
            ))}
            {!loading && members.length === 0 && <p className="text-sm text-dim">No members loaded yet.</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
