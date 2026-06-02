import { useEffect, useRef, useState } from "react";

/**
 * Heading that turns into an input when clicked. Commits on Enter/blur, cancels on Escape.
 * When `editable` is false it renders as a plain, non-interactive heading.
 */
export function EditableTitle({
  value,
  onSave,
  editable = true,
  className = "",
  placeholder = "Untitled",
}: {
  value: string;
  onSave: (next: string) => void | Promise<void>;
  editable?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== value) void onSave(next);
    else setDraft(value);
  };

  if (editing && editable) {
    return (
      <input
        ref={inputRef}
        className={`-mx-2 block w-full rounded-lg border border-accent/50 bg-white/[0.04] px-2 py-0.5 text-fg outline-none focus:shadow-[0_0_0_3px_rgba(99,102,241,0.25)] ${className}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <h1
      className={`${className} ${
        editable ? "-mx-2 cursor-text rounded-lg px-2 py-0.5 transition hover:bg-white/[0.04]" : ""
      }`}
      onClick={() => editable && setEditing(true)}
      title={editable ? "Click to rename" : undefined}
    >
      {value || placeholder}
    </h1>
  );
}
