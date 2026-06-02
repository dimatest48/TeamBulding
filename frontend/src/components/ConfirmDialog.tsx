import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { EASE_OUT_EXPO } from "../lib/motion";

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

/**
 * Styled confirmation modal that replaces window.confirm. Render it once and
 * drive it with the `useConfirm` hook below.
 */
export function ConfirmDialog({
  open,
  options,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  options: ConfirmOptions | null;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const danger = options?.tone !== "default";
  return (
    <AnimatePresence>
      {open && options && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[420px] rounded-card border border-line bg-elevated p-6 shadow-soft"
          >
            <div className="mb-4 flex items-center gap-3">
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                  danger ? "bg-rose/15 text-rose" : "bg-accent/15 text-accent"
                }`}
              >
                <AlertTriangle size={20} />
              </span>
              <h2 className="text-xl">{options.title}</h2>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-dim">{options.message}</p>
            <div className="flex justify-end gap-3">
              <button className="btn-outline px-5 py-2.5 text-sm" type="button" onClick={onCancel} disabled={busy}>
                {options.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
                  danger
                    ? "bg-rose shadow-[0_14px_40px_-14px_rgba(244,63,94,0.8)]"
                    : "bg-gradient-to-r from-accent to-accent-2 shadow-[0_14px_40px_-14px_rgba(99,102,241,0.8)]"
                }`}
              >
                {busy ? "Working…" : options.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Promise-based confirmation. `confirm(options)` resolves true/false. */
export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = (next: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      setOptions(next);
      setResolver(() => resolve);
      setOpen(true);
    });

  const settle = (value: boolean) => {
    resolver?.(value);
    setResolver(null);
    setOpen(false);
    setBusy(false);
  };

  const dialog = (
    <ConfirmDialog
      open={open}
      options={options}
      busy={busy}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );

  return { confirm, dialog };
}
