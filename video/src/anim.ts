import { Easing, interpolate } from "remotion";

export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Progress 0..1 from frame a to frame b with the default ease.
export function prog(frame: number, a: number, b: number, e: (t: number) => number = ease) {
  if (b <= a) return frame >= a ? 1 : 0;
  return e(clamp01((frame - a) / (b - a)));
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function popIn(frame: number, start = 0) {
  const t = prog(frame, start, start + 8);
  return { scale: lerp(0.92, 1, t), opacity: t };
}

// Deterministic pseudo random in [0,1).
export function rand(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function shake(frame: number, landing: number, amp: number, dur = 8) {
  const t = frame - landing;
  if (t < 0 || t > dur) return { x: 0, y: 0 };
  const k = (1 - t / dur) * amp;
  return { x: (rand(t * 3.1 + landing) * 2 - 1) * k, y: (rand(t * 7.7 + landing) * 2 - 1) * k };
}

export { interpolate };
