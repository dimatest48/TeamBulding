import { useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/** Authenticated fetch wrapper that attaches the current Clerk token. */
export function useApi() {
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

export type ApiFetch = ReturnType<typeof useApi>;
