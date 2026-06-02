import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { buildCubeMaterials } from "./materials";

const GAP = 1.0;
const SCALE = 0.58;
const AXES = ["x", "y", "z"] as const;
type Axis = (typeof AXES)[number];

function buildCube() {
  const root = new THREE.Group();
  root.scale.setScalar(SCALE);
  root.rotation.set(0.52, -0.6, -0.12); // isometric-ish presentation tilt
  // two temporary parents so two opposite slices can turn at the same time
  const pivots = [new THREE.Group(), new THREE.Group()];
  pivots.forEach((p) => root.add(p));

  const bodyGeo = new RoundedBoxGeometry(0.96, 0.96, 0.96, 4, 0.1);
  const stickerGeo = new THREE.PlaneGeometry(0.84, 0.84);
  const { faces, body } = buildCubeMaterials();

  const cubelets: THREE.Group[] = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        const cl = new THREE.Group();
        cl.position.set(x * GAP, y * GAP, z * GAP);
        cl.add(new THREE.Mesh(bodyGeo, body));

        const add = (mat: THREE.Material, pos: [number, number, number], rot: [number, number, number]) => {
          const m = new THREE.Mesh(stickerGeo, mat);
          m.position.set(...pos);
          m.rotation.set(...rot);
          cl.add(m);
        };
        if (x === 1) add(faces.px, [0.5, 0, 0], [0, Math.PI / 2, 0]);
        if (x === -1) add(faces.nx, [-0.5, 0, 0], [0, -Math.PI / 2, 0]);
        if (y === 1) add(faces.py, [0, 0.5, 0], [-Math.PI / 2, 0, 0]);
        if (y === -1) add(faces.ny, [0, -0.5, 0], [Math.PI / 2, 0, 0]);
        if (z === 1) add(faces.pz, [0, 0, 0.5], [0, 0, 0]);
        if (z === -1) add(faces.nz, [0, 0, -0.5], [0, Math.PI, 0]);

        root.add(cl);
        cubelets.push(cl);
      }
    }
  }
  return { root, pivots, cubelets };
}

function setAxis(euler: THREE.Euler, axis: Axis, value: number) {
  if (axis === "x") euler.x = value;
  else if (axis === "y") euler.y = value;
  else euler.z = value;
}

type CubeState = "idle" | "scrambling" | "scrambled_pause" | "solving" | "solved_pause";

const STATE_DURATIONS = {
  scrambled_pause: 2.0,
  solved_pause: 3.5,
  initial_wait: 2.5,
};

/** Mechanical slice easing: slow-start, accelerate, ~2% overshoot, snap-lock. */
function easeMechanical(t: number): number {
  if (t < 0.8) {
    const u = t / 0.8;
    const ease = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    return ease * 0.97;
  }
  const w = (t - 0.8) / 0.2;
  return 0.97 + w * 0.03 + 0.035 * Math.sin(w * Math.PI);
}

const TWO_PI = Math.PI * 2;
const SWING_SECONDS = 3.4; // base duration of one smooth whole-cube swing
const SWING_OVERLAP = 1.1; // start the next swing this many seconds before the current ends (crossfade)
const BASE_DRIFT = 0.03; // tiny constant drift
const STAGGER = 0.3; // delay between the two slices of a double turn
const DOUBLE_CHANCE = 0.4; // chance a move turns two opposite slices at once
const WORLD_Y = new THREE.Vector3(0, 1, 0);
const _dq = new THREE.Quaternion();

/** Smooth acceleration AND deceleration. */
function easeInOutSine(p: number) {
  return (1 - Math.cos(Math.PI * p)) / 2;
}

const SPIN_AXES = [
  new THREE.Vector3(0, 1, 0), // Y
  new THREE.Vector3(1, 0, 0), // X
  new THREE.Vector3(0, 0, 1), // Z
];

/** Next swing rotates around a DIFFERENT primary axis than the last, with a small random tilt. */
function pickSpinAxis(lastIdx: number) {
  let idx = Math.floor(Math.random() * 3);
  if (idx === lastIdx) idx = (idx + 1 + Math.floor(Math.random() * 2)) % 3;
  const axis = SPIN_AXES[idx].clone();
  axis.x += Math.random() * 0.3 - 0.15;
  axis.y += Math.random() * 0.3 - 0.15;
  axis.z += Math.random() * 0.3 - 0.15;
  return { axis: axis.normalize(), idx };
}

type Swing = { axis: THREE.Vector3; total: number; duration: number; time: number; prevAngle: number; spawned: boolean };
type SliceMove = { axis: Axis; layer: number; sign: number };
type ActiveSlice = SliceMove & {
  pivot: THREE.Group;
  time: number;
  duration: number;
  delay: number;
  started: boolean;
  members: THREE.Group[];
  done: boolean;
};

export function RubiksModel() {
  const { root, pivots, cubelets } = useMemo(buildCube, []);

  // whole-cube spin (crossfading swings)
  const swings = useRef<Swing[]>([]);
  const spinDir = useRef(1);
  const spinAxisIdx = useRef(0);

  // slice "solving" showcase
  const cubeState = useRef<CubeState>("idle");
  const stateTimer = useRef<number>(STATE_DURATIONS.initial_wait);
  const moveHistory = useRef<SliceMove[][]>([]);
  const movesRemaining = useRef<number>(0);
  const slices = useRef<ActiveSlice[]>([]);

  const makeSwing = (): Swing => {
    spinDir.current = spinDir.current > 0 ? -1 : 1;
    const turns = 0.25 + Math.random() * 0.19; // another ~30% slower top speed
    const picked = pickSpinAxis(spinAxisIdx.current);
    spinAxisIdx.current = picked.idx;
    return { axis: picked.axis, total: spinDir.current * turns * TWO_PI, duration: SWING_SECONDS + Math.random() * 0.8, time: 0, prevAngle: 0, spawned: false };
  };

  const attachSlice = (s: ActiveSlice) => {
    s.pivot.rotation.set(0, 0, 0);
    s.members = cubelets.filter((c) => Math.round(c.position[s.axis] / GAP) === s.layer);
    s.members.forEach((c) => s.pivot.attach(c));
    s.started = true;
  };

  const finishSlice = (s: ActiveSlice) => {
    setAxis(s.pivot.rotation, s.axis, (s.sign * Math.PI) / 2);
    s.pivot.updateWorldMatrix(true, false);
    s.members.forEach((c) => {
      root.attach(c);
      c.position.set(
        Math.round(c.position.x / GAP) * GAP,
        Math.round(c.position.y / GAP) * GAP,
        Math.round(c.position.z / GAP) * GAP,
      );
      c.rotation.set(
        Math.round(c.rotation.x / (Math.PI / 2)) * (Math.PI / 2),
        Math.round(c.rotation.y / (Math.PI / 2)) * (Math.PI / 2),
        Math.round(c.rotation.z / (Math.PI / 2)) * (Math.PI / 2),
      );
    });
    s.pivot.rotation.set(0, 0, 0);
    s.done = true;
  };

  /** Queue 1 (single) or 2 (double, opposite sides, staggered) slice turns onto the free pivots. */
  const issueMove = (moves: SliceMove[]) => {
    const duration = cubeState.current === "scrambling" ? 2.8 : 3.4;
    moves.forEach((m, i) => {
      slices.current.push({ ...m, pivot: pivots[i], time: 0, duration, delay: i * STAGGER, started: false, members: [], done: false });
    });
  };

  const makeScrambleMove = (): SliceMove[] => {
    const axis = AXES[Math.floor(Math.random() * 3)];
    if (Math.random() < DOUBLE_CHANCE) {
      // two opposite outer slices at once
      return [
        { axis, layer: 1, sign: Math.random() < 0.5 ? -1 : 1 },
        { axis, layer: -1, sign: Math.random() < 0.5 ? -1 : 1 },
      ];
    }
    return [{ axis, layer: [-1, 0, 1][Math.floor(Math.random() * 3)], sign: Math.random() < 0.5 ? -1 : 1 }];
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // 1. Whole-cube spin — crossfading swings: the next direction ramps in before the current one
    //    finishes, then the old swing is removed. Static position; tiny drift so it never fully stops.
    const sw = swings.current;
    if (sw.length === 0) sw.push(makeSwing());
    root.rotateOnWorldAxis(WORLD_Y, dt * BASE_DRIFT);
    for (const s of sw) {
      s.time += dt;
      const target = easeInOutSine(Math.min(s.time / s.duration, 1)) * s.total;
      _dq.setFromAxisAngle(s.axis, target - s.prevAngle);
      root.quaternion.premultiply(_dq);
      s.prevAngle = target;
    }
    const newest = sw[sw.length - 1];
    if (!newest.spawned && newest.time >= newest.duration - SWING_OVERLAP) {
      newest.spawned = true;
      sw.push(makeSwing()); // begin next direction before the current stops
    }
    for (let i = sw.length - 1; i >= 0; i--) if (sw[i].time >= sw[i].duration) sw.splice(i, 1);

    // 2. Slice turns (support up to two concurrent, staggered)
    for (const s of slices.current) {
      if (!s.started) {
        s.delay -= dt;
        if (s.delay > 0) continue;
        attachSlice(s);
      }
      s.time += dt;
      setAxis(s.pivot.rotation, s.axis, easeMechanical(Math.min(s.time / s.duration, 1)) * (Math.PI / 2) * s.sign);
      if (s.time >= s.duration) finishSlice(s);
    }
    slices.current = slices.current.filter((s) => !s.done);
    const slicesBusy = slices.current.length > 0;

    // 3. Showcase state machine
    if (!slicesBusy) {
      if (stateTimer.current > 0) {
        stateTimer.current -= dt;
      } else {
        switch (cubeState.current) {
          case "idle":
            cubeState.current = "scrambling";
            movesRemaining.current = 3 + Math.floor(Math.random() * 2);
            moveHistory.current = [];
            break;
          case "scrambling":
            if (movesRemaining.current > 0) {
              const move = makeScrambleMove();
              moveHistory.current.push(move);
              movesRemaining.current--;
              issueMove(move);
              stateTimer.current = 0.5 + Math.random() * 0.3; // halved interval between moves
            } else {
              cubeState.current = "scrambled_pause";
              stateTimer.current = STATE_DURATIONS.scrambled_pause;
            }
            break;
          case "scrambled_pause":
            cubeState.current = "solving";
            break;
          case "solving":
            if (moveHistory.current.length > 0) {
              const last = moveHistory.current.pop()!;
              issueMove(last.map((m) => ({ axis: m.axis, layer: m.layer, sign: -m.sign })));
              stateTimer.current = 0.5 + Math.random() * 0.3;
            } else {
              cubeState.current = "solved_pause";
              stateTimer.current = STATE_DURATIONS.solved_pause;
            }
            break;
          case "solved_pause":
            cubeState.current = "scrambling";
            movesRemaining.current = 3 + Math.floor(Math.random() * 2);
            break;
        }
      }
    }
  });

  return <primitive object={root} />;
}
