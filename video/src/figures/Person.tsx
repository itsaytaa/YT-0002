// Faceless pictogram person with a rounded-square head. Poses are joint sets in units
// where the standing height is 100, so poses can be interpolated (head turns, sitting down).
import React from "react";
import { C } from "../theme";
import { lerp } from "../anim";

type P = [number, number];
export type Pose = {
  head: { x: number; y: number; w: number; h: number; rot: number };
  torso: { x: number; y: number; w: number; h: number; rot: number };
  limbs: { far: P[][]; near: P[][] };
  book?: boolean;
};

const front: Pose = {
  head: { x: 0, y: -90, w: 20, h: 20, rot: 0 },
  torso: { x: 0, y: -59, w: 24, h: 38, rot: 0 },
  limbs: {
    far: [],
    near: [
      [[-13, -74], [-16, -60], [-17, -46]],
      [[13, -74], [16, -60], [17, -46]],
      [[-6, -42], [-6, -22], [-6, -3.5]],
      [[6, -42], [6, -22], [6, -3.5]],
    ],
  },
};

const side: Pose = {
  head: { x: 2, y: -90, w: 17, h: 20, rot: 0 },
  torso: { x: 0, y: -59, w: 19, h: 38, rot: 0 },
  limbs: {
    far: [
      [[-1, -73], [-3, -60], [-3, -47]],
      [[-2, -42], [-2, -22], [1, -3.5]],
    ],
    near: [
      [[2, -42], [2, -22], [6, -3.5]],
      [[2, -73], [4, -60], [5, -47]],
    ],
  },
};

const lookDownRight: Pose = { ...side, head: { x: 4.5, y: -88, w: 17, h: 20, rot: 20 } };

const sitChair: Pose = {
  head: { x: 3, y: -53, w: 17, h: 20, rot: 0 },
  torso: { x: 0, y: -21, w: 19, h: 38, rot: -3 },
  limbs: {
    far: [
      [[0, -35], [5, -22], [13, -17]],
      [[0, -3.5], [21, -3.5], [23, 27]],
    ],
    near: [
      [[2, -3.5], [24, -3.5], [26, 27]],
      [[3, -35], [8, -21], [16, -16]],
    ],
  },
};

const read: Pose = {
  ...sitChair,
  head: { x: 4, y: -52, w: 17, h: 20, rot: 12 },
  limbs: {
    far: [
      [[0, -35], [9, -24], [17, -30]],
      [[0, -3.5], [21, -3.5], [23, 27]],
    ],
    near: [
      [[2, -3.5], [24, -3.5], [26, 27]],
      [[3, -35], [11, -23], [19, -29]],
    ],
  },
  book: true,
};

const kneel: Pose = {
  head: { x: 2, y: -81, w: 17, h: 20, rot: 0 },
  torso: { x: 0, y: -51, w: 19, h: 38, rot: 4 },
  limbs: {
    far: [
      [[-1, -66], [5, -53], [9, -42]],
      [[-2, -34], [-4, -3.5], [-21, -3.5]],
    ],
    near: [
      [[2, -34], [16, -31], [17, -3.5]],
      [[3, -66], [13, -57], [22, -52]],
    ],
  },
};

const push: Pose = {
  head: { x: 13, y: -89, w: 17, h: 20, rot: 20 },
  torso: { x: 2.5, y: -60, w: 19, h: 38, rot: 20 },
  limbs: {
    far: [
      [[6, -71], [18, -66], [31, -65]],
      [[-5, -42], [-14, -22], [-24, -3.5]],
    ],
    near: [
      [[-3, -42], [6, -24], [7, -3.5]],
      [[7.6, -73], [20, -69], [33, -69]],
    ],
  },
};

const shrug: Pose = {
  head: { x: 0, y: -87, w: 20, h: 20, rot: 0 },
  torso: { x: 0, y: -58, w: 24, h: 38, rot: 0 },
  limbs: {
    far: [],
    near: [
      [[-13, -75], [-25, -60], [-36, -69]],
      [[13, -75], [25, -60], [36, -69]],
      [[-6, -41], [-6, -22], [-6, -3.5]],
      [[6, -41], [6, -22], [6, -3.5]],
    ],
  },
};

const sitFloorBack: Pose = {
  head: { x: 0, y: -66, w: 20, h: 20, rot: 0 },
  torso: { x: 0, y: -37, w: 24, h: 36, rot: 0 },
  limbs: {
    far: [],
    near: [
      [[-6, -19], [-25, -9], [-6, -4]],
      [[6, -19], [25, -9], [6, -4]],
      [[-13, -51], [-19, -35], [-21, -17]],
      [[13, -51], [19, -35], [21, -17]],
    ],
  },
};
const sitFloorBackDown: Pose = { ...sitFloorBack, head: { x: 0, y: -61, w: 20, h: 17, rot: 0 } };

const sitFloorSide: Pose = {
  head: { x: 4, y: -65, w: 17, h: 20, rot: 4 },
  torso: { x: 1, y: -37, w: 19, h: 36, rot: 5 },
  limbs: {
    far: [
      [[0, -50], [7, -36], [17, -27]],
      [[-2, -18], [21, -16], [12, -4]],
    ],
    near: [
      [[2, -18], [25, -12], [4, -3.5]],
      [[3, -50], [11, -35], [22, -24]],
    ],
  },
};

// Stand pose with the same limb structure as the side poses (for sit-down morphs).
const standSide = side;

export const POSES: Record<string, Pose> = {
  "stand-front": front,
  "stand-side": side,
  "stand-down-right": lookDownRight,
  "sit-chair": sitChair,
  "sit-sofa": sitChair,
  read,
  kneel,
  push,
  shrug,
  "sit-floor-back": sitFloorBack,
  "sit-floor-back-down": sitFloorBackDown,
  "sit-floor-side": sitFloorSide,
  "stand-side-for-sit": standSide,
};

const lp = (a: P, b: P, t: number): P => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const lpBox = <T extends Record<string, number>>(a: T, b: T, t: number): T =>
  Object.fromEntries(Object.keys(a).map((k) => [k, lerp(a[k], b[k], t)])) as T;

export function mixPose(a: Pose, b: Pose, t: number): Pose {
  const mixLimbs = (x: P[][], y: P[][]) => x.map((l, i) => l.map((p, j) => lp(p, (y[i] ?? l)[j], t)));
  return {
    head: lpBox(a.head, b.head, t),
    torso: lpBox(a.torso, b.torso, t),
    limbs: { far: mixLimbs(a.limbs.far, b.limbs.far), near: mixLimbs(a.limbs.near, b.limbs.near) },
    book: t < 0.5 ? a.book : b.book,
  };
}

const poly = (pts: P[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");

// Body parts in units; the caller places and scales the group.
export const PersonBody: React.FC<{ pose: Pose; color?: string }> = ({ pose, color = C.fg }) => {
  const { head: hd, torso: t } = pose;
  const limb = (pts: P[], i: number) => (
    <path key={i} d={poly(pts)} stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  );
  return (
    <g>
      {pose.limbs.far.map(limb)}
      <rect x={t.x - t.w / 2} y={t.y - t.h / 2} width={t.w} height={t.h} rx={8} fill={color} transform={`rotate(${t.rot} ${t.x} ${t.y})`} />
      {pose.limbs.near.map(limb)}
      {pose.book && (
        <g transform="translate(19 -30) rotate(-18)">
          <path d="M0 -8 L-6 -9 L-6 7 L0 8 L6 7 L6 -9 Z" fill={C.surface2} stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
          <path d="M0 -8 L0 8" stroke={color} strokeWidth={1.2} />
        </g>
      )}
      <rect x={hd.x - hd.w / 2} y={hd.y - hd.h / 2} width={hd.w} height={hd.h} rx={6} fill={color} transform={`rotate(${hd.rot} ${hd.x} ${hd.y})`} />
    </g>
  );
};

// Anchor points in units for a pose (person.head).
export const headOf = (pose: Pose) => ({ x: pose.head.x, y: pose.head.y });

// A person lying in bed: head on the pillow and the blanket shape (bed drawn separately).
export const PersonInBed: React.FC<{ w: number; color?: string }> = ({ w, color = C.fg }) => {
  const s = w / 100;
  return (
    <g transform={`scale(${s})`}>
      <path d="M-28 6 C -28 -10, -10 -16, 10 -14 C 34 -12, 52 -8, 64 0 L 70 8 L -30 8 Z" fill={C.surface2} stroke={C.line} strokeWidth={1.2} />
      <path d="M-30 4 C -6 -6, 30 -10, 66 4" stroke={C.dim} strokeWidth={0.8} fill="none" opacity={0.7} />
      <rect x={-50} y={-14} width={18} height={18} rx={5.5} fill={color} transform="rotate(-8 -41 -5)" />
    </g>
  );
};
