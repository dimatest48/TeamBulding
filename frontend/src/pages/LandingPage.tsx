import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, LayoutDashboard, Sparkles } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { HeroOrb } from "../components/HeroOrb";
import { fadeRise, staggerContainer } from "../lib/motion";

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas text-fg">
      {/* ambient accent glows */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 70% 0%, rgba(99,102,241,0.18) 0%, rgba(0,0,0,0) 55%), radial-gradient(ellipse 50% 45% at 15% 30%, rgba(139,92,246,0.12) 0%, rgba(0,0,0,0) 55%)",
        }}
        aria-hidden="true"
      />
      <nav className="relative mx-auto flex max-w-[1180px] items-center justify-between px-5 py-6 sm:px-10">
        <Link className="flex items-center gap-2.5 font-display text-lg font-semibold text-fg" to="/">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white">
            <BookOpen size={18} />
          </span>
          Tasker
        </Link>
        <SignedOut>
          <div className="flex items-center gap-3">
            <SignInButton mode="modal" forceRedirectUrl="/cabinet">
              <button className="font-medium text-dim transition hover:text-fg">Log in</button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/cabinet">
              <button className="btn-ghost">Get started</button>
            </SignUpButton>
          </div>
        </SignedOut>
        <SignedIn>
          <div className="flex items-center gap-3">
            <Link className="btn-ghost" to="/cabinet">
              Open cabinet
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
      </nav>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative mx-auto grid max-w-[1180px] items-center gap-12 px-5 pb-24 pt-10 sm:px-10 md:grid-cols-[1.05fr_0.95fr] md:gap-20"
      >
        <div>
          <motion.p variants={fadeRise} className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Clerk auth, shared study planning
          </motion.p>
          <motion.h1 variants={fadeRise} className="mb-5 text-4xl font-semibold leading-[1.04] text-fg sm:text-5xl md:text-6xl">
            Every subject, deadline, and group project in one calm cabinet.
          </motion.h1>
          <motion.p variants={fadeRise} className="mb-8 max-w-[30em] text-lg leading-relaxed text-dim">
            Plan deadlines, invite classmates, and break big assignments into focused study sessions.
          </motion.p>
          <motion.div variants={fadeRise} className="flex flex-wrap gap-3.5">
            <SignedOut>
              <SignUpButton mode="modal" forceRedirectUrl="/cabinet">
                <button className="btn-primary">
                  <Sparkles size={18} /> Create your cabinet
                </button>
              </SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl="/cabinet">
                <button className="btn-secondary">I already have one</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link className="btn-primary" to="/cabinet">
                <LayoutDashboard size={18} /> Go to cabinet
              </Link>
            </SignedIn>
          </motion.div>
        </div>

        <motion.div variants={fadeRise} className="relative flex flex-col items-center gap-8">
          <HeroOrb size={150} layoutId="hero-orb-landing" />
          <div className="w-full max-w-[360px] space-y-3">
            {[
              "3 tasks due this week",
              "Software Engineering shared with 4 classmates",
              "Exam prep split into 5 study sessions",
            ].map((t) => (
              <div key={t} className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.03] px-3.5 py-3">
                <CheckCircle2 className="shrink-0 text-sage" />
                <strong className="block text-sm text-fg">{t}</strong>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
}
