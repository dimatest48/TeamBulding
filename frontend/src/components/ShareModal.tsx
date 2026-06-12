import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Link2, Loader2, Lock, Mail, Trash2, X } from "lucide-react";
import type { ApiFetch } from "../lib/api";
import type { ShareRole, Task, TaskCollaborator, TaskShareLink } from "../lib/types";
import { EASE_OUT_EXPO } from "../lib/motion";
import { useToast } from "./Toast";
import { useConfirm } from "./ConfirmDialog";

const ROLE_LABEL: Record<string, string> = { owner: "Owner", editor: "Can edit", viewer: "Can view" };

function shareLinkUrl(token: string) {
  return `${window.location.origin}/share/${token}`;
}

function Avatar({ name }: { name: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-xs font-semibold text-white">
      {initials}
    </span>
  );
}

/** Premium share modal: invite by email (T-30), shareable links (T-31), view/revoke access (T-32). */
export function ShareModal({
  task,
  apiFetch,
  onClose,
}: {
  task: Task;
  apiFetch: ApiFetch;
  onClose: () => void;
}) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const canManage = task.role === "owner"; // owner-only sharing (T-35)

  const [collaborators, setCollaborators] = useState<TaskCollaborator[]>([]);
  const [links, setLinks] = useState<TaskShareLink[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ShareRole>("viewer");
  const [inviting, setInviting] = useState(false);

  const [linkRole, setLinkRole] = useState<ShareRole>("viewer");
  const [creatingLink, setCreatingLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    const requests = [apiFetch(`/tasks/${task.id}/collaborators`)];
    if (canManage) requests.push(apiFetch(`/tasks/${task.id}/share-links`));
    const [collabRes, linksRes] = await Promise.all(requests);
    if (collabRes?.ok) setCollaborators(await collabRes.json());
    if (linksRes?.ok) setLinks(await linksRes.json());
    setLoading(false);
  }, [apiFetch, task.id, canManage]);

  useEffect(() => {
    load();
  }, [load]);

  const sendInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || inviting) return;
    setInviting(true);
    try {
      const response = await apiFetch(`/tasks/${task.id}/collaborators/invite`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), role: inviteRole }),
      });
      if (response.ok) {
        toast.success(`Invitation sent to ${email.trim()}`);
        setEmail("");
        await load();
      } else {
        const detail = await response.json().catch(() => null);
        toast.error(detail?.detail ?? "Could not send the invitation");
      }
    } finally {
      setInviting(false);
    }
  };

  const createLink = async () => {
    if (creatingLink) return;
    setCreatingLink(true);
    try {
      const response = await apiFetch(`/tasks/${task.id}/share-links`, {
        method: "POST",
        body: JSON.stringify({ role: linkRole }),
      });
      if (response.ok) {
        const link: TaskShareLink = await response.json();
        setLinks((current) => [link, ...current]);
        await copyLink(link.token);
        toast.success("Shareable link created and copied");
      } else {
        toast.error("Could not create the link");
      }
    } finally {
      setCreatingLink(false);
    }
  };

  const copyLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(shareLinkUrl(token));
      setCopiedToken(token);
      toast.success("Link copied to clipboard");
      window.setTimeout(() => setCopiedToken((current) => (current === token ? null : current)), 1800);
    } catch {
      toast.error("Couldn't copy — copy it manually");
    }
  };

  const revokeCollaborator = async (collaborator: TaskCollaborator) => {
    const ok = await confirm({
      title: "Revoke access?",
      message: `${collaborator.name} (${collaborator.email}) will immediately lose access to this task.`,
      confirmLabel: "Revoke access",
    });
    if (!ok) return;
    const response = await apiFetch(`/tasks/${task.id}/collaborators/${collaborator.user_id}`, { method: "DELETE" });
    if (response.ok) {
      setCollaborators((current) => current.filter((item) => item.user_id !== collaborator.user_id));
      toast.success(`Access revoked for ${collaborator.name}`);
    } else {
      toast.error("Could not revoke access");
    }
  };

  const revokeLink = async (link: TaskShareLink) => {
    const ok = await confirm({
      title: "Revoke this link?",
      message: "Anyone who hasn't opened it yet will no longer be able to use it.",
      confirmLabel: "Revoke link",
    });
    if (!ok) return;
    const response = await apiFetch(`/tasks/${task.id}/share-links/${link.id}`, { method: "DELETE" });
    if (response.ok) {
      setLinks((current) => current.filter((item) => item.id !== link.id));
      toast.success("Link revoked");
    } else {
      toast.error("Could not revoke the link");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
        className="flex max-h-[88vh] w-full max-w-[520px] flex-col overflow-hidden rounded-card border border-line bg-elevated shadow-soft"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-xl">Share task</h2>
            <p className="mt-1 truncate text-sm text-dim">{task.title}</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {!canManage && (
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/[0.03] p-3.5 text-sm text-dim">
              <Lock size={16} className="shrink-0 text-faint" />
              <span>
                Only the task owner can manage sharing. You have{" "}
                <strong className="text-fg">{ROLE_LABEL[task.role] ?? task.role}</strong> access.
              </span>
            </div>
          )}

          {/* Invite by email (T-30) */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
              <Mail size={16} className="text-accent" /> Invite by email
            </h3>
            <form onSubmit={sendInvite} className="flex flex-col gap-2.5 sm:flex-row">
              <input
                className="field mt-0 flex-1"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@university.edu"
                disabled={!canManage || inviting}
                title={canManage ? undefined : "Only the owner can invite people"}
              />
              <div className="flex gap-2.5">
                <RoleSelect value={inviteRole} onChange={setInviteRole} disabled={!canManage || inviting} />
                <button
                  className="btn-accent shrink-0 px-5 py-3"
                  type="submit"
                  disabled={!canManage || inviting || !email.trim()}
                  title={canManage ? undefined : "Only the owner can invite people"}
                >
                  {inviting ? <Loader2 size={16} className="animate-spin" /> : "Invite"}
                </button>
              </div>
            </form>
          </section>

          {/* Shareable link (T-31) — owner only */}
          {canManage && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
                <Link2 size={16} className="text-accent" /> Shareable link
              </h3>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <RoleSelect value={linkRole} onChange={setLinkRole} disabled={creatingLink} className="flex-1" />
                <button className="btn-outline shrink-0 px-5 py-3 w-full sm:w-auto" type="button" onClick={createLink} disabled={creatingLink}>
                  {creatingLink ? <Loader2 size={16} className="animate-spin" /> : <><Link2 size={16} /> Create link</>}
                </button>
              </div>

              <AnimatePresence initial={false}>
                {links.map((link) => (
                  <motion.div
                    key={link.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                    className="mt-2.5 flex items-center gap-2 rounded-xl border border-line bg-white/[0.03] p-2 pl-3.5"
                  >
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-dim">
                      {ROLE_LABEL[link.role]}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-dim">{shareLinkUrl(link.token)}</span>
                    <button
                      type="button"
                      onClick={() => copyLink(link.token)}
                      className="icon-btn"
                      aria-label="Copy link"
                      title="Copy link"
                    >
                      {copiedToken === link.token ? <Check size={16} className="text-sage" /> : <Copy size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => revokeLink(link)}
                      className="icon-btn hover:bg-rose/10 hover:text-rose"
                      aria-label="Revoke link"
                      title="Revoke link"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </section>
          )}

          {/* People with access (T-32) */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-fg">People with access</h3>
            {loading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-dim">
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {collaborators.map((person) => (
                    <motion.div
                      key={person.user_id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                      className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.03] p-2.5"
                    >
                      <Avatar name={person.name} />
                      <div className="min-w-0 flex-1">
                        <strong className="block truncate text-sm text-fg">{person.name}</strong>
                        <span className="block truncate text-xs text-dim">{person.email}</span>
                      </div>
                      <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-dim">
                        {ROLE_LABEL[person.role] ?? person.role}
                      </span>
                      {canManage && person.role !== "owner" && (
                        <button
                          type="button"
                          onClick={() => revokeCollaborator(person)}
                          className="icon-btn hover:bg-rose/10 hover:text-rose"
                          aria-label={`Revoke access for ${person.name}`}
                          title="Revoke access"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>
      </motion.div>
      {dialog}
    </div>
  );
}

function RoleSelect({
  value,
  onChange,
  disabled,
  className = "",
}: {
  value: ShareRole;
  onChange: (role: ShareRole) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      className={`field mt-0 w-auto ${className}`}
      value={value}
      onChange={(event) => onChange(event.target.value as ShareRole)}
      disabled={disabled}
    >
      <option value="viewer">Can view</option>
      <option value="editor">Can edit</option>
    </select>
  );
}
