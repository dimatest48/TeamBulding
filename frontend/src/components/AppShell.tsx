import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

/** Dark app layout: persistent sidebar + scrollable main canvas with a center glow. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-canvas text-fg md:grid-cols-[264px_1fr]">
      <Sidebar />
      <main className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99,102,241,0.08) 0%, rgba(0,0,0,0) 60%)",
          }}
          aria-hidden="true"
        />
        <section className="relative p-6 sm:p-12">{children}</section>
      </main>
    </div>
  );
}
