import { useState } from "react";
import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

/** Dark app layout: responsive sidebar + top mobile header + main content container. */
export function AppShell({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-fg md:grid md:grid-cols-[264px_1fr]">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer Container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[270px] transform transition-transform duration-300 ease-in-out md:static md:w-auto md:transform-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content Pane */}
      <div className="flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-panel/60 px-4 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white/[0.03] text-dim hover:text-fg"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2.5 font-display text-lg font-semibold text-fg">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white">
              <span className="text-sm font-bold">T</span>
            </span>
            Tasker
          </div>
          <div className="w-9" /> {/* spacing balance placeholder */}
        </header>

        <main className="relative flex-1 overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99,102,241,0.08) 0%, rgba(0,0,0,0) 60%)",
            }}
            aria-hidden="true"
          />
          <section className="relative p-4 sm:p-12">{children}</section>
        </main>
      </div>
    </div>
  );
}
