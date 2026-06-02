import { motion } from "framer-motion";
import { ORB_LAYOUT_TRANSITION } from "../lib/motion";

/**
 * Glossy monochrome "app-icon" tile holding a 3D glass orb — built entirely from
 * layered radial gradients (no image asset). Carries the shared `layoutId` so it
 * morphs between the large empty-state position and the small in-header slot.
 */
export function HeroOrb({ size = 140, layoutId = "hero-orb" }: { size?: number; layoutId?: string }) {
  // Glassy sphere faked with stacked gradients (front layer first).
  const sphereBackground = [
    "radial-gradient(circle at 33% 27%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 13%)",
    "radial-gradient(ellipse 60% 40% at 50% 94%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.45) 9%, rgba(255,255,255,0) 34%)",
    "repeating-radial-gradient(circle at 50% 66%, rgba(255,255,255,0.05) 0 7%, rgba(0,0,0,0.28) 7% 13%)",
    "radial-gradient(circle at 50% 34%, #3c3c42 0%, #18181b 46%, #050506 100%)",
  ].join(", ");

  return (
    <motion.div
      layoutId={layoutId}
      transition={ORB_LAYOUT_TRANSITION}
      style={{
        width: size,
        height: size,
        borderRadius: "30%",
        background: "linear-gradient(160deg, #1c1c20 0%, #0a0a0c 60%, #050506 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.05), 0 30px 70px -24px rgba(0,0,0,0.9)",
      }}
      className="relative grid shrink-0 place-items-center"
      aria-hidden="true"
    >
      {/* gentle idle float on an inner wrapper to avoid clashing with the layout morph */}
      <motion.div
        animate={{ y: [0, -size * 0.04, 0] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        style={{
          width: "62%",
          height: "62%",
          borderRadius: "9999px",
          background: sphereBackground,
          boxShadow:
            "inset 0 -2px 6px rgba(255,255,255,0.45), inset 0 3px 10px rgba(0,0,0,0.85), 0 6px 18px -4px rgba(0,0,0,0.7)",
        }}
      />
    </motion.div>
  );
}
