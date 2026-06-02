import { Users } from "lucide-react";
import type { ApiFetch } from "../lib/api";
import type { Invite } from "../lib/types";

export function InvitationsPanel({
  invites,
  apiFetch,
  reload,
}: {
  invites: Invite[];
  apiFetch: ApiFetch;
  reload: () => Promise<void>;
}) {
  if (invites.length === 0) return null;
  return (
    <section className="card mb-6 border-accent-2/30 bg-accent-2/[0.06]">
      <h2 className="mb-4 flex items-center gap-2 text-2xl">
        <Users size={22} /> Invitations
      </h2>
      <div className="space-y-2">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white/[0.03] p-3"
          >
            <div>
              <strong className="text-fg">{invite.subject_name}</strong>
              <p className="text-sm text-dim">Role: {invite.role}</p>
            </div>
            <div className="flex gap-2">
              <button
                className="btn-primary px-4 py-2"
                type="button"
                onClick={async () => {
                  const response = await apiFetch(`/invites/${invite.token}/accept`, { method: "POST" });
                  if (response.ok) await reload();
                }}
              >
                Accept
              </button>
              <button
                className="btn-outline px-4 py-2"
                type="button"
                onClick={async () => {
                  const response = await apiFetch(`/invites/${invite.token}/decline`, { method: "POST" });
                  if (response.ok) await reload();
                }}
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
