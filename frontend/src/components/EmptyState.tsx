import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { HeroOrb } from "./HeroOrb";
import { emptyStateContent } from "../lib/motion";

/**
 * Resend-style empty state: a large centered glowing orb, a bold title, a muted
 * subtitle, and a white pill CTA. The orb shares `layoutId` with the header orb,
 * so adding the first item smoothly flies it up beside the page title.
 */
export function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  orbId,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  orbId?: string;
}) {
  return (
    <div className="relative grid min-h-[60vh] place-items-center overflow-hidden rounded-card border border-line bg-canvas px-6 py-16 text-center">
      {/* soft center vignette glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 45% at 50% 40%, rgba(99,102,241,0.10) 0%, rgba(0,0,0,0) 70%)",
        }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center">
        <HeroOrb size={140} layoutId={orbId} />
        <motion.h2
          variants={emptyStateContent}
          custom={0}
          initial="hidden"
          animate="show"
          className="mt-9 text-3xl font-bold text-fg"
        >
          {title}
        </motion.h2>
        <motion.p
          variants={emptyStateContent}
          custom={1}
          initial="hidden"
          animate="show"
          className="mt-3 max-w-[34ch] text-base leading-relaxed text-dim"
        >
          {subtitle}
        </motion.p>
        <motion.button
          type="button"
          onClick={onAction}
          variants={emptyStateContent}
          custom={2}
          initial="hidden"
          animate="show"
          whileTap={{ scale: 0.96 }}
          className="btn-primary mt-8"
        >
          <Plus size={18} /> {actionLabel}
        </motion.button>
      </div>
    </div>
  );
}
