import type { Transition, Variants } from "framer-motion";

/** Fluid, non-linear easing curve shared across the app. */
export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

/** Snappy spring used for tactile UI feedback (nav, taps). */
export const SPRING_SNAP: Transition = { type: "spring", stiffness: 420, damping: 32, mass: 0.7 };

/** Softer spring used for the hero-orb layout morph. */
export const SPRING_SOFT: Transition = { type: "spring", stiffness: 220, damping: 28, mass: 0.9 };

/** Shared-layout transition for the orb shrinking from empty-state to header. */
export const ORB_LAYOUT_TRANSITION: Transition = {
  layout: SPRING_SOFT,
  default: { duration: 0.6, ease: EASE_OUT_EXPO },
};

/** Sidebar row hover/tap micro-interactions. */
export const navItemMotion = {
  whileHover: { x: 2 },
  whileTap: { scale: 0.96 },
  transition: SPRING_SNAP,
};

export const navIconMotion = {
  whileHover: { scale: 1.14, rotate: -4 },
  transition: SPRING_SNAP,
};

/** Fade-rise used for page sections and list items. */
export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT_EXPO } },
};

/** Stagger container for lists. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

/** Empty-state content (title/subtitle/CTA) reveal. */
export const emptyStateContent: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.1 + i * 0.08 },
  }),
};
