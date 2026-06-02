import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useApi } from "./api";
import { dedupeTasks } from "./tasks";
import type { Invite, Subject, Task, UserRead } from "./types";

/** Loads subjects, tasks, invites, and the current user; syncs Clerk profile to the backend. */
export function useWorkspaceData() {
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
