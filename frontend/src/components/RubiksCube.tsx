import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { RubiksModel } from "./cube/RubiksModel";
import { Lighting } from "./cube/Lighting";
import { Pedestal } from "./cube/Pedestal";

/** Photoreal metallic Rubik's cube hero — multi-material faces on a reflective pedestal in a blue studio. */
export function RubiksCube() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0.4, 1.3, 7], fov: 30 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.4 }}
      style={{ width: "100%", height: "100%" }}
    >
      <Lighting />
      <RubiksModel />
      <Pedestal />
    </Canvas>
  );
}
