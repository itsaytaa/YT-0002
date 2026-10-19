// Pictogram cat. Drawn in units (sitting height to ear tips ~100, origin at the ground
// point, facing right). The head is a small 3D-ish model with a yaw angle so it can
// turn from profile to front (face close-ups, head turns).
import React from "react";
import { C } from "../theme";
import { lerp } from "../anim";

export type HeadProps = {
  cx: number;
  cy: number;
  r: number;
  yaw?: number; // degrees; 0 = facing viewer, +70 = profile right, 180 = from behind
  showEyes?: boolean;
  eyeOpen?: number; // 0..1
  pupil?: number; // 0..1 pupil width (dilation)
  earsBack?: number; // 0..1
  earScale?: number;
  detail?: boolean; // close-up detail (iris, whiskers, inner ears)
  color?: string;
  back?: boolean; // seen from behind: no face
};

const rad = (d: number) => (d * Math.PI) / 180;

export const CatHead: React.FC<HeadProps> = ({ cx, cy, r, yaw = 0, showEyes = false, eyeOpen = 1, pupil = 0.25, earsBack = 0, earScale = 1, detail = false, color = C.fg, back = false }) => {
  const y = back ? 0 : yaw;
  const ears = [-36, 36].map((a) => {
    const ang = a + y;
    const ex = cx + r * 0.92 * Math.sin(rad(ang)) * (Math.abs(y) > 20 ? 0.62 : 1) - Math.sin(rad(y)) * r * 0.12;
    const depth = Math.cos(rad(ang));
    const baseW = r * 0.82 * (0.55 + 0.45 * Math.abs(depth));
    const hgt = r * 0.95 * earScale * (1 - 0.45 * earsBack);
    const tilt = Math.sign(a) * (16 + 40 * earsBack) + (y > 0 ? 6 : y < 0 ? -6 : 0);
    const by = cy - r * 0.55;
    return { ex, by, baseW, hgt, tilt, depth };
  });
  const ear = (e: (typeof ears)[number], i: number, inner: boolean) => {
    const s = inner ? 0.55 : 1;
    const bw = e.baseW * s;
    const h = e.hgt * s;
    const d = `M${-bw / 2} 0 Q ${-bw * 0.18} ${-h * 0.7} 0 ${-h} Q ${bw * 0.18} ${-h * 0.7} ${bw / 2} 0 Z`;
    return <path key={`${i}${inner}`} d={d} fill={inner ? C.surface2 : color} transform={`translate(${e.ex} ${e.by + (inner ? -e.hgt * 0.12 : 0)}) rotate(${e.tilt})`} opacity={inner ? 0.85 : 1} />;
  };
  const eyeData = [-29, 29].map((a) => {
    const ang = a + y;
    return { x: cx + r * 0.9 * Math.sin(rad(ang)), vis: Math.cos(rad(ang)) };
  });
  const showFace = !back && Math.abs(y) < 88;
  const faceFade = Math.max(0, Math.min(1, (88 - Math.abs(y)) / 25));
  const muzzleX = cx + r * 0.95 * Math.sin(rad(y));
  const noseVis = Math.cos(rad(y));
  return (
    <g>
      {ears.map((e, i) => ear(e, i, false))}
      {detail && ears.map((e, i) => (e.depth > 0.2 ? ear(e, i, true) : null))}
      <ellipse cx={cx} cy={cy} rx={r * 1.08} ry={r} fill={color} />
      {/* cheeks */}
      <ellipse cx={cx} cy={cy + r * 0.22} rx={r * 1.14} ry={r * 0.72} fill={color} />
      {!back && <ellipse cx={muzzleX} cy={cy + r * 0.3} rx={r * 0.42} ry={r * 0.32} fill={color} />}
      {showFace && showEyes &&
        eyeData.map((e, i) => {
          if (e.vis < 0.15) return null;
          const w = r * 0.42 * e.vis;
          const h = r * 0.27 * Math.max(0.06, eyeOpen);
          const ey = cy - r * 0.08 + (1 - eyeOpen) * r * 0.06;
          const almond = `M${e.x - w / 2} ${ey} Q ${e.x} ${ey - h * 1.25} ${e.x + w / 2} ${ey} Q ${e.x} ${ey + h * 1.25} ${e.x - w / 2} ${ey} Z`;
          return (
            <g key={i} opacity={faceFade}>
              <path d={almond} fill={C.bg} />
              {detail && eyeOpen > 0.3 && (
                <>
                  <clipPath id={`eyeclip${i}${Math.round(cx)}${Math.round(cy)}`}>
                    <path d={almond} />
                  </clipPath>
                  <g clipPath={`url(#eyeclip${i}${Math.round(cx)}${Math.round(cy)})`}>
                    <ellipse cx={e.x + (y / 90) * w * 0.15} cy={ey} rx={h * 0.95} ry={h * 0.95} fill="#22303d" />
                    <ellipse cx={e.x + (y / 90) * w * 0.15} cy={ey} rx={Math.max(1.2, h * 0.95 * lerp(0.16, 0.78, pupil) * e.vis)} ry={h * 1.05} fill="#000" />
                    <circle cx={e.x + w * 0.12} cy={ey - h * 0.4} r={h * 0.13} fill={C.fg} opacity={0.85} />
                  </g>
                </>
              )}
              {!detail && eyeOpen > 0.3 && <ellipse cx={e.x} cy={ey} rx={Math.max(0.6, w * 0.08)} ry={h * 0.75} fill="#2b3642" />}
            </g>
          );
        })}
      {showFace && showEyes && noseVis > 0.5 && (
        <g opacity={faceFade}>
          <path d={`M${muzzleX - r * 0.1} ${cy + r * 0.14} L ${muzzleX + r * 0.1} ${cy + r * 0.14} L ${muzzleX} ${cy + r * 0.25} Z`} fill={C.bg} />
          {detail && (
            <path d={`M${muzzleX} ${cy + r * 0.25} L ${muzzleX} ${cy + r * 0.34} M${muzzleX} ${cy + r * 0.34} Q ${muzzleX - r * 0.1} ${cy + r * 0.42} ${muzzleX - r * 0.18} ${cy + r * 0.36} M${muzzleX} ${cy + r * 0.34} Q ${muzzleX + r * 0.1} ${cy + r * 0.42} ${muzzleX + r * 0.18} ${cy + r * 0.36}`} stroke={C.bg} strokeWidth={r * 0.025} fill="none" strokeLinecap="round" />
          )}
        </g>
      )}
      {detail && showFace && (
        <g opacity={faceFade * 0.8} stroke={C.dim} strokeWidth={r * 0.012} strokeLinecap="round" fill="none">
          {[-1, 1].map((s) =>
            [0, 1, 2].map((k) => {
              const x0 = muzzleX + s * r * 0.5;
              const y0 = cy + r * (0.28 + k * 0.07);
              return <path key={`${s}${k}`} d={`M${x0} ${y0} Q ${x0 + s * r * 0.6} ${y0 - r * 0.06 + k * r * 0.05} ${x0 + s * r * 1.15} ${y0 + (k - 1) * r * 0.14}`} />;
            }),
          )}
        </g>
      )}
    </g>
  );
};

export type CatProps = {
  pose: string;
  t?: number; // frames since the element appeared
  fps?: number;
  yaw?: number;
  eyes?: string;
  eyeOpen?: number;
  earsBack?: number;
  old?: boolean;
  step?: number; // walk frame 0/1
  breathe?: number; // 0..1
  headDip?: number; // 0..1 head lowered
  tailCurl?: number;
  color?: string;
};

const TAIL_W = 8.5;

// Side profile sitting (sit-side / stare / head-turn), facing right.
const SitSide: React.FC<CatProps> = ({ yaw = 72, eyes, eyeOpen = 1, earsBack = 0, old, color = C.fg }) => {
  const earScale = old ? 0.85 : 1;
  const showProfileEye = !!eyes && eyes !== "open";
  const r = 15;
  const hx = 13, hy = -69;
  return (
    <g>
      <path d="M-22 -5 C -36 -2, -48 -2, -58 -5 C -64 -7, -66 -9, -66 -11" stroke={color} strokeWidth={TAIL_W} strokeLinecap="round" fill="none" />
      <ellipse cx={-12} cy={-21} rx={23} ry={21} fill={color} />
      <ellipse cx={-2} cy={-35} rx={17} ry={28} fill={color} transform="rotate(-16 -2 -35)" />
      <ellipse cx={8} cy={-40} rx={12} ry={20} fill={color} />
      <path d="M2 -52 Q 8 -64 14 -60" stroke={color} strokeWidth={14} fill="none" />
      <rect x={4} y={-34} width={8} height={33} rx={4} fill={color} opacity={0.92} />
      <rect x={10} y={-32} width={8.5} height={31} rx={4.2} fill={color} />
      <ellipse cx={16} cy={-2.6} rx={7.5} ry={3.4} fill={color} />
      <path d="M11 -30 L 11 -4" stroke={C.bg} strokeWidth={1.1} opacity={0.55} />
      <CatHead cx={hx} cy={hy} r={r} yaw={yaw} earsBack={earsBack} earScale={earScale} color={color} showEyes={Math.abs(yaw) < 50} eyeOpen={eyeOpen} />
      {showProfileEye && Math.abs(yaw) >= 50 && (
        <path
          d={(() => {
            const ex = hx + Math.sign(yaw) * r * 0.62, ey = hy - 2.5;
            const w = 6.5, h = 2.6 * Math.max(0.08, eyeOpen);
            return `M${ex - w / 2} ${ey} Q ${ex} ${ey - h * 1.3} ${ex + w / 2} ${ey - 0.6} Q ${ex} ${ey + h} ${ex - w / 2} ${ey} Z`;
          })()}
          fill={C.bg}
        />
      )}
    </g>
  );
};

const SitBack: React.FC<CatProps> = ({ color = C.fg, old }) => (
  <g>
    <path d="M6 -4 C 18 -3, 30 -4, 34 -12 C 37 -19, 33 -24, 29 -24" stroke={color} strokeWidth={TAIL_W} strokeLinecap="round" fill="none" />
    <ellipse cx={0} cy={-17} rx={29} ry={17} fill={color} />
    <ellipse cx={0} cy={-34} rx={24} ry={29} fill={color} />
    <path d="M-10 -58 Q 0 -66 10 -58" stroke={color} strokeWidth={14} fill="none" />
    <CatHead cx={0} cy={-71} r={16.5} back color={color} earScale={old ? 0.85 : 1} />
    <path d="M0 -50 Q -2 -30 0 -10" stroke={C.bg} strokeWidth={1} opacity={0.25} fill="none" />
  </g>
);

const SitFront: React.FC<CatProps> = ({ color = C.fg, eyeOpen = 1, headDip = 0, old }) => (
  <g>
    <path d="M-24 -12 C -28 -2, -18 2, -4 -1" stroke={color} strokeWidth={TAIL_W} strokeLinecap="round" fill="none" />
    <ellipse cx={0} cy={-15} rx={27} ry={15} fill={color} />
    <ellipse cx={0} cy={-33} rx={22} ry={28} fill={color} />
    <path d="M0 -40 L 0 -3" stroke={C.bg} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
    <path d="M-9 -2 Q -5 -5 -1 -2 M1 -2 Q 5 -5 9 -2" stroke={C.bg} strokeWidth={1.4} fill="none" opacity={0.8} />
    <g transform={`translate(0 ${headDip * 9}) rotate(${headDip * 4} 0 -60)`}>
      <path d="M-9 -56 Q 0 -62 9 -56" stroke={color} strokeWidth={14} fill="none" />
      <CatHead cx={0} cy={-70} r={18} yaw={0} showEyes eyeOpen={eyeOpen} color={color} earScale={old ? 0.85 : 1} />
    </g>
  </g>
);

const Loaf: React.FC<CatProps> = ({ color = C.fg }) => (
  <g>
    <path d="M-36 -5 C -20 0, 6 1, 26 -3" stroke={color} strokeWidth={TAIL_W} strokeLinecap="round" fill="none" />
    <ellipse cx={0} cy={-16} rx={38} ry={16} fill={color} />
    <ellipse cx={-14} cy={-20} rx={22} ry={14} fill={color} />
    <CatHead cx={22} cy={-33} r={13} back color={color} />
  </g>
);

const Walk: React.FC<CatProps> = ({ color = C.fg, step = 0 }) => {
  const a = step ? 1 : -1;
  const leg = (x: number, dx: number, k: number) => <path key={k} d={`M${x} -44 L ${x + dx} -3`} stroke={color} strokeWidth={7} strokeLinecap="round" />;
  return (
    <g>
      <path d="M-30 -50 C -42 -56, -48 -70, -44 -82 C -42 -88, -36 -88, -36 -84" stroke={color} strokeWidth={TAIL_W} strokeLinecap="round" fill="none" />
      {leg(-22, -4 * a, 0)}
      {leg(18, 5 * a, 1)}
      <ellipse cx={0} cy={-49} rx={33} ry={15} fill={color} />
      {leg(-16, 5 * a, 2)}
      {leg(24, -5 * a, 3)}
      <path d="M22 -52 Q 30 -60 36 -60" stroke={color} strokeWidth={13} fill="none" />
      <CatHead cx={37} cy={-63} r={13} yaw={72} color={color} />
    </g>
  );
};

const Sleep: React.FC<CatProps> = ({ color = C.fg, breathe = 0 }) => (
  <g transform={`scale(1 ${1 + 0.03 * breathe})`}>
    <ellipse cx={0} cy={-14} rx={34} ry={14} fill={color} />
    <ellipse cx={-8} cy={-18} rx={22} ry={12} fill={color} />
    <CatHead cx={21} cy={-15} r={11.5} yaw={-20} showEyes eyeOpen={0} color={color} earScale={0.9} />
    <path d="M-34 -6 C -30 2, 2 3, 30 -2" stroke={color} strokeWidth={7.5} strokeLinecap="round" fill="none" />
    <path d="M-30 -5 C -24 0, 2 1, 28 -3" stroke={C.bg} strokeWidth={1.2} fill="none" opacity={0.4} />
  </g>
);

export const Cat: React.FC<CatProps> = (p) => {
  switch (p.pose) {
    case "sit-back":
      return <SitBack {...p} />;
    case "sit-front":
      return <SitFront {...p} />;
    case "loaf":
      return <Loaf {...p} />;
    case "walk":
      return <Walk {...p} />;
    case "sleep":
      return <Sleep {...p} />;
    default:
      return <SitSide {...p} />;
  }
};

// Anchor points in units (facing right) per pose.
export const CAT_ANCHORS: Record<string, Record<string, [number, number]>> = {
  side: { eyes: [22, -72], ears: [19, -92], tail: [-52, -5], paws: [15, -3], haunch: [-18, -26], head: [13, -69] },
  back: { eyes: [0, -76], ears: [0, -94], tail: [30, -10], paws: [0, -3], haunch: [0, -20], head: [0, -71] },
  front: { eyes: [0, -72], ears: [0, -96], tail: [-20, -4], paws: [0, -3], haunch: [0, -20], head: [0, -70] },
  loaf: { eyes: [24, -36], ears: [24, -50], tail: [-30, -4], paws: [20, -3], haunch: [-14, -20], head: [22, -33] },
  walk: { eyes: [44, -65], ears: [40, -80], tail: [-42, -78], paws: [20, -3], haunch: [-20, -48], head: [37, -63] },
  sleep: { eyes: [24, -16], ears: [24, -28], tail: [-30, -4], paws: [10, -3], haunch: [-10, -16], head: [21, -15] },
};

export const catAnchorKey = (pose: string) =>
  pose === "sit-back" ? "back" : pose === "sit-front" ? "front" : pose === "loaf" ? "loaf" : pose === "walk" ? "walk" : pose === "sleep" ? "sleep" : "side";

// Close-up head (face-close), units: r = 36 for h = 100.
export const CatFace: React.FC<{ yaw: number; pupil: number; eyeOpen?: number }> = ({ yaw, pupil, eyeOpen = 1 }) => (
  <CatHead cx={0} cy={0} r={36} yaw={yaw} showEyes detail pupil={pupil} eyeOpen={eyeOpen} />
);
