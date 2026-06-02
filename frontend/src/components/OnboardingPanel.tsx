import { useState } from "react";
import { Plus } from "lucide-react";
import type { Subject, UserRead } from "../lib/types";
import { PALETTE } from "../lib/tasks";

export function OnboardingPanel({
  me,
  subjects,
  onCreateSubject,
  onComplete,
}: {
  me: UserRead | null;
  subjects: Subject[];
  onCreateSubject: (name: string, color: string) => Promise<void>;
  onComplete: () => Promise<void>;
}) {
  const [subjectName, setSubjectName] = useState("");
  const [goal, setGoal] = useState("Finish the week with no overdue tasks");
  if (!me || me.onboarding_completed) return null;

  return (
    <section className="card mb-9 border-accent/30 bg-gradient-to-br from-accent/[0.12] to-accent-2/[0.06]">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="eyebrow">First setup</p>
          <h2 className="mt-1 text-2xl">Build your study cabinet</h2>
          <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-dim">
            Add your first subjects and choose a semester goal. You can change everything later.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <span
                key={subject.id}
                className="rounded-full border border-line bg-white/5 px-3 py-1 text-sm font-semibold text-fg"
              >
                {subject.name}
              </span>
            ))}
          </div>
        </div>
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (subjectName.trim()) {
              await onCreateSubject(subjectName.trim(), PALETTE[subjects.length % PALETTE.length]);
              setSubjectName("");
            } else {
              await onComplete();
            }
          }}
        >
          <input
            className="field"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="Add a subject"
          />
          <input
            className="field"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Semester goal"
          />
          <div className="flex gap-2">
            <button className="btn-primary flex-1" type="submit">
              <Plus size={18} /> Add
            </button>
            <button className="btn-outline flex-1" type="button" onClick={onComplete}>
              Done
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
