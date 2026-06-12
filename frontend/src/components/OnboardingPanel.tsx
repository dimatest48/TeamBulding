import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import type { Subject, UserRead } from "../lib/types";
import { PALETTE } from "../lib/tasks";

export function OnboardingPanel({
  me,
  subjects,
  onCreateSubject,
  onCreateTask,
  onComplete,
}: {
  me: UserRead | null;
  subjects: Subject[];
  onCreateSubject: (name: string, color: string) => Promise<void>;
  onCreateTask: (title: string) => Promise<void>;
  onComplete: () => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [subjectName, setSubjectName] = useState("");
  const [taskName, setTaskName] = useState("");

  if (!me || me.onboarding_completed) return null;

  const skipOnboarding = async () => {
    await onComplete();
  };

  return (
    <section className="card mb-8 border-accent/30 bg-gradient-to-br from-accent/[0.12] to-accent-2/[0.06]">
      {step === 1 && (
        <div className="max-w-xl">
          <p className="eyebrow">Welcome 👋</p>

          <h2 className="mt-2 text-3xl font-semibold">
            What subject do you have today?
          </h2>

          <p className="mt-3 text-sm text-dim">
            Create your first subject to start organizing your studies.
          </p>

          <div className="mt-6 space-y-3">
            <input
              className="field"
              placeholder="Math, Physics, English..."
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                className="btn-primary flex-1"
                onClick={async () => {
                  if (!subjectName.trim()) return;

                  await onCreateSubject(
                    subjectName,
                    PALETTE[subjects.length % PALETTE.length]
                  );

                  setStep(2);
                }}
              >
                <Plus size={18} />
                Create subject
              </button>

              <button
                className="btn-outline"
                onClick={skipOnboarding}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-xl">
          <p className="eyebrow">Step 2</p>

          <h2 className="mt-2 text-3xl font-semibold">
            Add a task for {subjects[subjects.length - 1]?.name}
          </h2>

          <p className="mt-3 text-sm text-dim">
            Example: Homework, Project, Presentation...
          </p>

          <div className="mt-6 space-y-3">
            <input
              className="field"
              placeholder="Homework"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                className="btn-primary flex-1"
                onClick={async () => {
                  if (taskName.trim()) {
                    await onCreateTask(taskName);
                  }

                  await onComplete();
                }}
              >
                <ArrowRight size={18} />
                Finish
              </button>

              <button
                className="btn-outline"
                onClick={skipOnboarding}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}