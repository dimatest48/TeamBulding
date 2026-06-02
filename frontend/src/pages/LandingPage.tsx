import { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { BookOpen, CalendarDays, LayoutDashboard, Share2, Sparkles, Target } from "lucide-react";
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

// Heavy 3D scene (three.js) is code-split so it only loads on the landing page.
const RubiksCube = lazy(() => import("../components/RubiksCube").then((m) => ({ default: m.RubiksCube })));

const FEATURES = [
  { icon: CalendarDays, title: "Never miss a deadline", body: "Every task carries a due date, priority, and status — sorted so the urgent stuff surfaces first." },
  { icon: Share2, title: "Study together", body: "Share a subject with classmates, assign view or edit access, and plan group projects in one place." },
  { icon: Target, title: "Break work into sessions", body: "Split big assignments into focused study sessions and watch each subject's progress climb." },
];

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas text-fg">
      {/* ambient accent glows */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 72% 8%, rgba(99,102,241,0.18) 0%, rgba(0,0,0,0) 55%), radial-gradient(ellipse 50% 45% at 12% 30%, rgba(139,92,246,0.12) 0%, rgba(0,0,0,0) 55%)",
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
        className="relative mx-auto grid max-w-[1180px] items-center gap-10 px-5 pb-10 pt-8 sm:px-10 md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:pt-12"
      >
        <div>
          <motion.p variants={fadeRise} className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Clerk auth · shared study planning
          </motion.p>
          <motion.h1 variants={fadeRise} className="mb-5 text-4xl font-semibold leading-[1.04] text-fg sm:text-5xl md:text-6xl">
            Every subject, deadline, and group project in one calm cabinet.
          </motion.h1>
          <motion.p variants={fadeRise} className="mb-8 max-w-[32em] text-lg leading-relaxed text-dim">
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

        <motion.div variants={fadeRise} className="relative h-[340px] sm:h-[420px] md:h-[460px]">
          {/* soft blue ambiance that fades fully into the page — no panel, border, or field */}
          <div
            className="pointer-events-none absolute -inset-x-10 -inset-y-6"
            style={{
              background:
                "radial-gradient(55% 55% at 55% 42%, rgba(60,95,170,0.22) 0%, rgba(35,55,110,0.10) 38%, rgba(0,0,0,0) 70%)",
            }}
            aria-hidden="true"
          />
          <Suspense
            fallback={
              <div className="grid h-full place-items-center">
                <HeroOrb size={150} layoutId="hero-orb-landing" />
              </div>
            }
          >
            <RubiksCube />
          </Suspense>
        </motion.div>
      </motion.section>

      {/* feature band */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="relative mx-auto grid max-w-[1180px] gap-4 px-5 pb-24 pt-6 sm:px-10 md:grid-cols-3"
      >
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <motion.div
            key={title}
            variants={fadeRise}
            className="rounded-card border border-line bg-white/[0.03] p-6 transition-colors hover:border-line-strong"
          >
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
              <Icon size={22} />
            </div>
            <h3 className="mb-2 text-lg text-fg">{title}</h3>
            <p className="text-sm leading-relaxed text-dim">{body}</p>
          </motion.div>
        ))}
      </motion.section>
    </div>
  );
}
