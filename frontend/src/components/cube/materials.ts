import * as THREE from "three";
import { brushedMaps, hammeredMaps, meshMaps } from "./textures";

export type FaceKey = "px" | "nx" | "py" | "ny" | "pz" | "nz";

/** Builds the four photoreal metal materials + the per-face mapping (matches image_3). */
export function buildCubeMaterials() {
  // Polished black chrome — near-perfect mirror, driven by the environment.
  const chrome = new THREE.MeshPhysicalMaterial({
    color: "#0a0b10",
    metalness: 1.0,
    roughness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.7,
  });

  // Vertically brushed anodized black.
  const brushed = brushedMaps();
  const anodized = new THREE.MeshPhysicalMaterial({
    color: "#0c0d11",
    metalness: 0.85,
    roughness: 0.42,
    roughnessMap: brushed.rough,
    normalMap: brushed.normal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    anisotropy: 0.7,
    anisotropyRotation: Math.PI / 2, // align highlight with the vertical brushing
    envMapIntensity: 0.7,
  });

  // Hammered / dimpled gunmetal — lighter, strongly bumped.
  const hammeredM = hammeredMaps();
  const hammered = new THREE.MeshPhysicalMaterial({
    color: "#3a3e46",
    metalness: 0.82,
    roughness: 0.44,
    roughnessMap: hammeredM.rough,
    normalMap: hammeredM.normal,
    normalScale: new THREE.Vector2(1.0, 1.0),
    envMapIntensity: 0.85,
  });

  // Woven stainless wire mesh — see-through holes via alpha test.
  const meshM = meshMaps();
  const wire = new THREE.MeshPhysicalMaterial({
    color: "#0a0a0c",
    metalness: 0.95,
    roughness: 0.45,
    normalMap: meshM.normal,
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughnessMap: meshM.rough,
    alphaMap: meshM.alpha,
    alphaTest: 0.45,
    side: THREE.DoubleSide,
    envMapIntensity: 0.6,
  });

  const body = new THREE.MeshStandardMaterial({ color: "#08080a", metalness: 0.55, roughness: 0.6, envMapIntensity: 0.45 });

  const faces: Record<FaceKey, THREE.Material> = {
    py: chrome,
    ny: chrome,
    pz: anodized,
    nz: anodized,
    px: hammered,
    nx: wire,
  };

  return { faces, body };
}
