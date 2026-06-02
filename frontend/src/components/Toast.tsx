import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { EASE_OUT_EXPO } from "../lib/motion";

type ToastTone = "success" | "error" | "info";

type Toast = { id: number; tone: ToastTone; message: string };

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, { icon: typeof Info; ring: string; glow: string }> = {
  success: {
    icon: CheckCircle2,
    ring: "border-sage/40 text-sage",
    glow: "shadow-[0_18px_50px_-18px_rgba(52,211,153,0.55)]",
  },
  error: {
    icon: AlertTriangle,
    ring: "border-rose/40 text-rose",
    glow: "shadow-[0_18px_50px_-18px_rgba(244,63,94,0.55)]",
  },
  info: {
    icon: Info,
    ring: "border-accent/40 text-accent",
    glow: "shadow-[0_18px_50px_-18px_rgba(99,102,241,0.55)]",
  },
};

/** Lightweight, animated toast stack. Mount <ToastProvider> once near the app root. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, tone, message }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message) => toast(message, "success"),
      error: (message) => toast(message, "error"),
      info: (message) => toast(message, "info"),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(92vw,380px)] flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {toasts.map(({ id, tone, message }) => {
            const { icon: Icon, ring, glow } = TONE_STYLES[tone];
            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
                className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-elevated/95 px-4 py-3.5 backdrop-blur ${ring} ${glow}`}
              >
                <Icon size={18} className="mt-0.5 shrink-0" />
                <p className="flex-1 text-sm leading-snug text-fg">{message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(id)}
                  className="-mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-dim transition hover:bg-white/10 hover:text-fg"
                  aria-label="Dismiss notification"
                >
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return context;
}
