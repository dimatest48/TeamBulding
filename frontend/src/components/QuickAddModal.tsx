import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { EASE_OUT_EXPO } from "../lib/motion";

/** Minimal single-field composer used by empty states to create the first item. */
export function QuickAddModal({
  title,
  placeholder,
  actionLabel,
  onSubmit,
  onClose,
}: {
  title: string;
  placeholder: string;
  actionLabel: string;
  onSubmit: (value: string) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!value.trim() || saving) return;
    setSaving(true);
    try {
      await onSubmit(value.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
        className="w-full max-w-[420px] rounded-card border border-line bg-elevated p-6 shadow-soft"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl">{title}</h2>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            className="field"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
          />
          <button className="btn-primary w-full" type="submit" disabled={saving}>
            <Plus size={18} /> {saving ? "Adding…" : actionLabel}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
