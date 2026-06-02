import { FileText, Folder, Users } from "lucide-react";
import type { ApiFetch } from "../lib/api";
import type { Invite, TaskInvite } from "../lib/types";
import { useToast } from "./Toast";

export function InvitationsPanel({
  invites,
  taskInvites = [],
  apiFetch,
  reload,
}: {
  invites: Invite[];
  taskInvites?: TaskInvite[];
  apiFetch: ApiFetch;
  reload: () => Promise<void>;
}) {
  const toast = useToast();
  if (invites.length === 0 && taskInvites.length === 0) return null;

  const respond = async (path: string, onOk: string) => {
    const response = await apiFetch(path, { method: "POST" });
    if (response.ok) {
      toast.success(onOk);
      await reload();
    } else {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="card mb-6 border-accent-2/30 bg-accent-2/[0.06]">
      <h2 className="mb-4 flex items-center gap-2 text-2xl">
        <Users size={22} /> Invitations
      </h2>
      <div className="space-y-2">
        {invites.map((invite) => (
          <div
            key={`subject-${invite.id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white/[0.03] p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                <Folder size={17} />
              </span>
              <div className="min-w-0">
                <strong className="block truncate text-fg">{invite.subject_name}</strong>
                <p className="text-sm text-dim">Subject · {invite.role === "editor" ? "can edit" : "can view"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="btn-primary px-4 py-2"
                type="button"
                onClick={() => respond(`/invites/${invite.token}/accept`, `Joined ${invite.subject_name}`)}
              >
                Accept
              </button>
              <button
                className="btn-outline px-4 py-2"
                type="button"
                onClick={() => respond(`/invites/${invite.token}/decline`, "Invitation declined")}
              >
                Decline
              </button>
            </div>
          </div>
        ))}

        {taskInvites.map((invite) => (
          <div
            key={`task-${invite.id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white/[0.03] p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-2/15 text-accent-2">
                <FileText size={17} />
              </span>
              <div className="min-w-0">
                <strong className="block truncate text-fg">{invite.task_title}</strong>
                <p className="text-sm text-dim">
                  Task{invite.invited_by_name ? ` from ${invite.invited_by_name}` : ""} ·{" "}
                  {invite.role === "editor" ? "can edit" : "can view"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="btn-primary px-4 py-2"
                type="button"
                onClick={() => respond(`/task-invites/${invite.token}/accept`, `“${invite.task_title}” added to Shared with me`)}
              >
                Accept
              </button>
              <button
                className="btn-outline px-4 py-2"
                type="button"
                onClick={() => respond(`/task-invites/${invite.token}/decline`, "Invitation declined")}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
