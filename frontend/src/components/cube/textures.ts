import * as THREE from "three";

const SIZE = 256;

function rawCanvas(draw: (x: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  draw(c.getContext("2d")!);
  return c;
}

function toTex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Sobel filter over a grayscale height canvas → a tangent-space normal map texture. */
function heightToNormal(src: HTMLCanvasElement, strength = 2) {
  const w = src.width;
  const h = src.height;
  const data = src.getContext("2d")!.getImageData(0, 0, w, h).data;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const octx = out.getContext("2d")!;
  const img = octx.createImageData(w, h);
  const at = (x: number, y: number) => {
    const xx = (x + w) % w;
    const yy = (y + h) % h;
    return data[(yy * w + xx) * 4] / 255;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x - 1, y) - at(x + 1, y)) * strength;
      const dy = (at(x, y - 1) - at(x, y + 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * w + x) * 4;
      img.data[i] = ((dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / len) * 255;
      img.data[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return toTex(out);
}

export type MaterialMaps = { rough: THREE.Texture; normal: THREE.Texture; alpha?: THREE.Texture };

/** Vertically brushed anodized metal. */
export function brushedMaps(): MaterialMaps {
  const height = rawCanvas((x) => {
    x.fillStyle = "#8a8a8a";
    x.fillRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < 1600; i++) {
      const gx = Math.random() * SIZE;
      const v = 110 + Math.random() * 120;
      x.strokeStyle = `rgba(${v | 0},${v | 0},${v | 0},0.35)`;
      x.lineWidth = Math.random() * 1.4 + 0.3;
      x.beginPath();
      x.moveTo(gx, 0);
      x.lineTo(gx + (Math.random() * 2 - 1), SIZE);
      x.stroke();
    }
  });
  return { rough: toTex(height), normal: heightToNormal(height, 1.1) };
}

/** Hammered / dimpled metal — many soft craters. */
export function hammeredMaps(): MaterialMaps {
  const height = rawCanvas((x) => {
    x.fillStyle = "#9c9c9c";
    x.fillRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < 170; i++) {
      const cx = Math.random() * SIZE;
      const cy = Math.random() * SIZE;
      const r = 10 + Math.random() * 22;
      const g = x.createRadialGradient(cx, cy, 1, cx, cy, r);
      g.addColorStop(0, "rgba(45,45,45,0.85)");
      g.addColorStop(0.65, "rgba(150,150,150,0.35)");
      g.addColorStop(1, "rgba(180,180,180,0)");
      x.fillStyle = g;
      x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  });
  return { rough: toTex(height), normal: heightToNormal(height, 3.2) };
}

/** Woven stainless wire mesh — over/under wires with see-through holes. */
export function meshMaps(): MaterialMaps {
  const n = 11;
  const cell = SIZE / n;
  const wire = cell * 0.6;
  const drawWeave = (x: CanvasRenderingContext2D, bg: string, lo: string, hi: string) => {
    x.fillStyle = bg;
    x.fillRect(0, 0, SIZE, SIZE);
    const bar = (horizontal: boolean, p: number) => {
      const g = horizontal
        ? x.createLinearGradient(0, p - wire / 2, 0, p + wire / 2)
        : x.createLinearGradient(p - wire / 2, 0, p + wire / 2, 0);
      g.addColorStop(0, lo);
      g.addColorStop(0.5, hi);
      g.addColorStop(1, lo);
      x.fillStyle = g;
      if (horizontal) x.fillRect(0, p - wire / 2, SIZE, wire);
      else x.fillRect(p - wire / 2, 0, wire, SIZE);
    };
    for (let i = 0; i < n; i++) bar(false, i * cell + cell / 2); // vertical wires
    for (let i = 0; i < n; i++) bar(true, i * cell + cell / 2); // horizontal wires (on top)
  };
  const height = rawCanvas((x) => drawWeave(x, "#101010", "#2a2a2a", "#d8d8d8"));
  const alpha = rawCanvas((x) => drawWeave(x, "#000000", "#ffffff", "#ffffff"));
  return { rough: toTex(height), normal: heightToNormal(height, 2.4), alpha: toTex(alpha) };
}
