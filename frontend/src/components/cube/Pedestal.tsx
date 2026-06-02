import { ContactShadows } from "@react-three/drei";

/**
 * Soft grounding shadow only — transparent so the cube blends seamlessly into the page
 * (no opaque reflective floor / horizon line / framed field).
 */
export function Pedestal() {
  return <ContactShadows position={[0, -1.35, 0]} opacity={0.5} scale={6} blur={2.8} far={4} color="#01030a" />;
}
