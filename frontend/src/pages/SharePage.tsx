import { useCallback, useEffect, useRef, useState } from "react";
import { SignInButton, SignUpButton, useAuth } from "@clerk/clerk-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Eye, Loader2, Pencil, ShieldCheck } from "lucide-react";
import { API_URL, useApi } from "../lib/api";
import type { SharePreview, Task } from "../lib/types";
import { useToast } from "../components/Toast";
import { fadeRise } from "../lib/motion";

const INTENT_KEY = "tasker:shareIntent";

type Status = "loading" | "preview" | "accepting" | "error";

export function SharePage() {
  const { token = "" } = useParams();
  const { isLoaded, isSignedIn } = useAuth();
  const apiFetch = useApi();
  const navigate = useNavigate();
  const toast = useToast();

  const [status, setStatus] = useState<Status>("loading");
  const [preview, setPreview] = useState<SharePreview | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const accepted = useRef(false);
  const promptedLogin = useRef(false);

  const here = `/share/${token}`;

  // Public preview — no auth required (T-34).
  const loadPreview = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/share/${token}`);
      if (!response.ok) {
        setErrorMessage("This share link is no longer active.");
        setStatus("error");
        return;
      }
      setPreview(await response.json());
      setStatus("preview");
    } catch {
      setErrorMessage("We couldn't reach the server. Please try again.");
      setStatus("error");
    }
  }, [token]);

  // Authenticated redeem — grants access then opens the task (T-31 + T-34).
  const acceptLink = useCallback(async () => {
    if (accepted.current) return;
    accepted.current = true;
    setStatus("accepting");
    const response = await apiFetch(`/share/${token}/accept`, { method: "POST" });
    if (response.ok) {
      const task: Task = await response.json();
      localStorage.removeItem(INTENT_KEY);
      toast.success("Task added to “Shared with me”");
      navigate(`/tasks/${task.id}`, { replace: true });
    } else {
      setErrorMessage("This share link is no longer active.");
      setStatus("error");
    }
  }, [apiFetch, navigate, token, toast]);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      acceptLink();
      return;
    }
    // Signed out: remember the intent and show the preview + auth prompt (T-34).
    localStorage.setItem(INTENT_KEY, here);
    if (!promptedLogin.current) {
      promptedLogin.current = true;
      toast.info("Please log in to view the shared task");
    }
    loadPreview();
  }, [isLoaded, isSignedIn, acceptLink, loadPreview, here, toast]);

  const roleBadge =
    preview?.role === "editor"
      ? { icon: Pencil, label: "Can edit" }
      : { icon: Eye, label: "Can view" };
  const RoleIcon = roleBadge.icon;

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-canvas px-5 py-12 text-fg">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 18%, rgba(99,102,241,0.16) 0%, rgba(0,0,0,0) 60%)",
        }}
        aria-hidden="true"
      />
      <Link className="absolute left-6 top-6 flex items-center gap-2.5 font-display text-lg font-semibold text-fg" to="/">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white">
          <BookOpen size={18} />
        </span>
        Tasker
      </Link>

      <motion.div variants={fadeRise} initial="hidden" animate="show" className="relative w-full max-w-[460px]">
        {(status === "loading" || status === "accepting") && (
          <div className="card flex flex-col items-center gap-4 py-14 text-center">
            <Loader2 size={28} className="animate-spin text-accent" />
            <p className="text-sm text-dim">{status === "accepting" ? "Opening the shared task…" : "Loading…"}</p>
          </div>
        )}

        {status === "error" && (
          <div className="card flex flex-col items-center gap-4 py-12 text-center">
            <h1 className="text-2xl">Link unavailable</h1>
            <p className="max-w-[34ch] text-sm leading-relaxed text-dim">{errorMessage}</p>
            <Link className="btn-primary mt-2" to="/">
              Go home
            </Link>
          </div>
        )}

        {status === "preview" && preview && (
          <div className="card text-center">
            <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
              <ShieldCheck size={26} />
            </span>
            <p className="eyebrow">Shared task</p>
            <h1 className="mt-2 text-2xl leading-tight">{preview.title}</h1>
            <p className="mt-3 text-sm text-dim">
              <strong className="text-fg">{preview.owner_name}</strong> wants to give you access
            </p>
            <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-dim">
              <RoleIcon size={14} className="text-accent" /> {roleBadge.label}
            </div>

            <div className="mt-7 grid gap-3">
              <SignUpButton mode="modal" forceRedirectUrl={here} signInForceRedirectUrl={here}>
                <button className="btn-primary w-full" type="button">
                  Create account & open
                </button>
              </SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl={here} signUpForceRedirectUrl={here}>
                <button className="btn-secondary w-full" type="button">
                  I already have an account
                </button>
              </SignInButton>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-faint">
              Log in to continue. We'll bring you straight back to this task.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
