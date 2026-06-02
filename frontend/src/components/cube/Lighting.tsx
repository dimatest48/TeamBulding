import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

const faceOrigin = (self: THREE.Object3D) => self.lookAt(0, 0, 0);

/** Chiaroscuro rig: cool sapphire rim + warm amber fill + a procedural blue studio for reflections. */
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.28} />
      {/* main cool-white key, top-left/front — defines the top + visible faces */}
      <directionalLight position={[-4, 6, 5]} intensity={2.6} color="#dbe6ff" />
      {/* cool sapphire rim, top-left/behind */}
      <directionalLight position={[-6, 7, -3]} intensity={2.2} color="#5b7cff" />
      {/* warm amber fill, bottom-right/front */}
      <directionalLight position={[6, -3, 5]} intensity={0.85} color="#ffb070" />
      <pointLight position={[3, 4, 4]} intensity={14} distance={22} color="#cfe0ff" />

      {/* Procedural studio env (no HDRI fetch) — drives chrome reflections. Baked once. */}
      <Environment resolution={256} frames={1} background={false}>
        <color attach="background" args={["#070b14"]} />
        {/* broad blue key panel */}
        <Lightformer form="rect" intensity={3} color="#4a66e0" scale={[12, 8, 1]} position={[-5, 5, -4]} onUpdate={faceOrigin} />
        {/* bright vertical streak so chrome shows a crisp specular line */}
        <Lightformer form="rect" intensity={7} color="#eef3ff" scale={[1.6, 10, 1]} position={[5, 3, 3]} onUpdate={faceOrigin} />
        {/* second soft white streak for layered reflections */}
        <Lightformer form="rect" intensity={3} color="#cfe0ff" scale={[1, 8, 1]} position={[-3, 2, 5]} onUpdate={faceOrigin} />
        {/* overhead softbox — keeps the polished top mirror-bright like image_3 */}
        <Lightformer form="rect" intensity={5} color="#eaf1ff" scale={[7, 7, 1]} position={[0, 8, 1]} onUpdate={faceOrigin} />
        {/* warm amber accent, bottom-right */}
        <Lightformer form="circle" intensity={1.4} color="#ffb070" scale={[6, 6, 1]} position={[5, -4, 3]} onUpdate={faceOrigin} />
        {/* deep navy base fill */}
        <Lightformer form="rect" intensity={0.5} color="#16243f" scale={[18, 18, 1]} position={[0, 0, -7]} onUpdate={faceOrigin} />
      </Environment>
    </>
  );
}
