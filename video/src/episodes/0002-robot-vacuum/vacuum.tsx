// Advisory 0002: the robot vacuum (side view, the episode's hero figure) and the dusty
// footprints it erases. Spec: advisories/0002-robot-vacuum/assets-spec.md.
import React from "react";
import { C } from "../../theme";
import { clamp01, ease, easeInOut, lerp, prog, rand } from "../../anim";
import type { CustomElementProps } from "../../episode-context";

// ---------------------------------------------------------------- footprints
// Print i of a trail from fromX toward toX (120 px per step at scale 1, feet alternating
// 6 px above and below the floor line).
export function printsOf(fromX: number, toX: number, scale = 1) {
  const dir = toX >= fromX ? 1 : -1;
  const step = 120 * scale;
  const n = Math.floor(Math.abs(toX - fromX) / step) + 1;
  return Array.from({ length: n }, (_, i) => ({ i, x: fromX + dir * i * step, dy: (i % 2 ? 6 : -6) * scale, dir }));
}

// One print: slightly too long and too narrow for a person, heel a little narrower than
// the front, a few loose specks around it. No toes.
export const Print: React.FC<{ x: number; y: number; dir: number; s: number; seed: number; opacity?: number }> = ({ x, y, dir, s, seed, opacity = 1 }) => (
  <g opacity={opacity}>
    <g fill={C.dim} opacity={0.55}>
      <ellipse cx={x + dir * 4 * s} cy={y} rx={13 * s} ry={3.5 * s} />
      <ellipse cx={x - dir * 9 * s} cy={y + 0.2 * s} rx={8 * s} ry={2.7 * s} />
      {Array.from({ length: 2 + Math.floor(rand(seed) * 2) }, (_, k) => (
        <circle
          key={k}
          cx={x + (rand(seed * 3.1 + k * 7.7) * 2 - 1) * 24 * s}
          cy={y + (rand(seed * 5.3 + k * 2.9) * 2 - 1) * 6 * s}
          r={(0.8 + rand(seed + k * 4.4) * 0.8) * s}
        />
      ))}
    </g>
  </g>
);

// A little loose dust in a corner (kind: "specks").
const Specks: React.FC<{ fromX: number; toX: number; y: number; s: number }> = ({ fromX, toX, y, s }) => {
  const l = Math.min(fromX, toX), w = Math.abs(toX - fromX);
  return (
    <g fill={C.dim} opacity={0.55}>
      {Array.from({ length: 26 }, (_, k) => {
        const f = rand(k * 3.7 + 1);
        return <circle key={k} cx={l + f * w} cy={y - 2 + (rand(k * 9.1) * 2 - 1) * 5 * s} r={(0.9 + rand(k * 1.3) * 1.6) * s} />;
      })}
      <ellipse cx={l + w * 0.6} cy={y + 1} rx={w * 0.22} ry={2.2 * s} opacity={0.6} />
    </g>
  );
};

export const DustTrail: React.FC<CustomElementProps> = ({ e, t, dur }) => {
  const s = e.scale ?? 1;
  const y = e.y ?? 780;
  if (e.kind === "specks") return <Specks fromX={e.fromX} toX={e.toX} y={y} s={s} />;
  const prints = printsOf(e.fromX, e.toX, s);
  const n = prints.length;
  return (
    <g>
      {prints.map((p) => {
        let op = 1;
        if (e.draw === "sequence") {
          const at = n > 1 ? (p.i / (n - 1)) * dur * 0.7 : 0;
          op = clamp01((t - at) / 4);
          if (op <= 0) return null;
        }
        return <Print key={p.i} x={p.x} y={y + p.dy} dir={p.dir} s={s} seed={p.i + 1} opacity={op} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------- robot vacuum
type Move = { fromX: number; toX: number; from?: number; to?: number; stops?: number };

// Position along a move (frames), with optional stops: n+1 equal legs, each eased, and a
// pause between legs. Returns x, whether it is driving, and the frames into a pause.
function moveState(m: Move, t: number, dur: number, fps: number) {
  const a = (m.from ?? 0) * dur, b = (m.to ?? 1) * dur;
  const stops = m.stops ?? 0;
  if (!stops) {
    const p = prog(t, a, b, easeInOut);
    return { x: lerp(m.fromX, m.toX, p), moving: t > a && t < b, pause: -1 };
  }
  const pauseLen = Math.min(fps * 0.9, ((b - a) * 0.5) / stops);
  const legLen = (b - a - pauseLen * stops) / (stops + 1);
  const legs = stops + 1;
  let x = m.fromX, moving = false, pause = -1;
  for (let i = 0; i < legs; i++) {
    const s0 = a + i * (legLen + pauseLen);
    const x0 = lerp(m.fromX, m.toX, i / legs), x1 = lerp(m.fromX, m.toX, (i + 1) / legs);
    if (t < s0) break;
    x = lerp(x0, x1, prog(t, s0, s0 + legLen, easeInOut));
    moving = t > s0 && t < s0 + legLen;
    const p0 = s0 + legLen;
    if (i < stops && t >= p0 && t < p0 + pauseLen) pause = t - p0;
  }
  return { x, moving, pause };
}

const LED_COLORS = { blue: C.blue, red: C.red, dim: C.blue, off: C.line } as const;

export const RobotVacuum: React.FC<CustomElementProps> = ({ e, t, dur, fps }) => {
  const w: number = e.w ?? 200;
  const y: number = e.y ?? 780;
  const sec = t / fps;
  const baseDir = e.facing === "left" ? -1 : 1;

  // --- position
  let x: number = e.x;
  let moving = false;
  let pause = -1;
  if (e.move) ({ x, moving, pause } = moveState(e.move, t, dur, fps));

  // --- turn on the spot: the round body narrows a little while the features (bumper,
  // sensor window, LED, turret) swing across it; halfway through it faces the camera.
  let f = baseDir; // feature direction, -1..1
  let bw = 1; // body width scale
  let turning = false;
  if (e.turn) {
    const at = (e.turn.at ?? 0.5) * dur;
    const p = prog(t, at, at + fps * 0.5, easeInOut);
    f = baseDir * Math.cos(Math.PI * p);
    bw = 1 - 0.18 * Math.sin(Math.PI * p);
    turning = p > 0 && p < 1;
  }
  // --- stops: "turns to look" (scaleX 1 → 0.85 → 1) and one LED blink.
  let look = 1;
  let blinkOff = false;
  if (pause >= 0) {
    look = 1 - 0.15 * Math.sin(Math.PI * clamp01(pause / (fps * 0.4)));
    blinkOff = pause > fps * 0.45 && pause < fps * 0.55;
  }
  // --- bumps: 6 px forward over 3 frames, back over 6.
  let bump = 0;
  const bumpHits: number[] = [];
  if (e.bump) {
    const { count = 3, at = 0.2, gap = 0.6 } = e.bump;
    for (let i = 0; i < count; i++) {
      const b0 = (at + i * gap) * fps;
      const d = t - b0;
      if (d >= 0 && d < 3) bump = 6 * ease(d / 3);
      else if (d >= 3 && d < 9) bump = 6 * (1 - easeInOut((d - 3) / 6));
      if (d >= 2 && d < 14) bumpHits.push(d);
    }
  }
  // --- stuck under the sofa: a small shake every ~0.8 s.
  let shakeX = 0;
  if (e.stuck) {
    const c = t % Math.round(fps * 0.8);
    if (c < 6) shakeX = (c % 2 ? -2 : 2) * (1 - c / 6);
  }
  const lift = e.docked ? -4 : 0;
  const dirMove = Math.sign(f) || baseDir;
  const cx = x + bump * dirMove + shakeX;

  // --- LED
  const light: keyof typeof LED_COLORS = e.light ?? "blue";
  let ledOp = light === "dim" ? 0.35 : light === "off" ? 1 : 1;
  const anims: string[] = (Array.isArray(e.anim) ? e.anim : e.anim ? [e.anim] : []).map((a: any) => (typeof a === "string" ? a : Object.keys(a)[0]));
  if (anims.includes("led-breathe") && light !== "off") ledOp *= 0.35 + 0.65 * (0.5 - 0.5 * Math.cos((sec / 2.5) * 2 * Math.PI));
  if (e.stuck && light !== "off") ledOp *= Math.floor(sec * 2) % 2 === 0 ? 1 : 0.12;
  if (blinkOff) ledOp *= 0.1;
  const ledColor = LED_COLORS[light] ?? C.blue;
  const ledGlow = light === "red" ? "url(#glowRed)" : light === "off" ? undefined : "url(#glowBlue)";

  const body = e.color === "grey" ? C.grey : e.color === "dim" ? C.dim : C.fg;
  const bodyFilter = e.color === "dim" || e.color === "grey" ? "url(#glowSoft)" : "url(#glow)";

  // Geometry in units of w, right-facing; feature x is multiplied by f.
  const top = -0.24 * w, bottom = -0.04 * w;
  const half = (w / 2) * bw;
  const fx = (u: number) => u * w * f;
  const af = Math.abs(f);

  // Side brush: three short strokes under the front edge, spinning while it drives.
  const spin = moving || turning ? t * 0.9 : 0.6;
  const brushX = fx(0.36);

  // Laser fan (hidden while turning or blinded). It sweeps out over the first 0.8 s.
  const beamOn = e.beam && !turning && light !== "red";
  const L = Math.min(1150, Math.max(520, w * 2.4)) * prog(t, 2, fps * 0.8, ease);
  const ox = fx(0.49), oy = -0.15 * w;
  const scanP = ((sec % 1.2) / 1.2);

  return (
    <g>
      {/* clean strip behind it + the prints still ahead of its front */}
      {e.trail && (() => {
        const ts = e.trail.scale ?? 1;
        const tdir = e.trail.toX >= e.trail.fromX ? 1 : -1;
        const front = x + tdir * w * 0.45;
        const stripTo = x;
        return (
          <g>
            {(stripTo - e.trail.fromX) * tdir > 0 && (
              <rect x={Math.min(e.trail.fromX, stripTo)} y={y - 2} width={Math.abs(stripTo - e.trail.fromX)} height={6} fill={C.line} opacity={0.25} />
            )}
            {printsOf(e.trail.fromX, e.trail.toX, ts)
              .filter((p) => (p.x - front) * tdir > 0)
              .map((p) => (
                <Print key={p.i} x={p.x} y={y + p.dy} dir={p.dir} s={ts} seed={p.i + 1} />
              ))}
          </g>
        );
      })()}

      {/* red light leaking from under the sofa when it is stuck (its LED is hidden) */}
      {e.stuck && light === "red" && (
        <ellipse cx={x - baseDir * w * 0.36} cy={y + 2} rx={w * 0.42} ry={w * 0.05} fill={C.red} opacity={0.32 * ledOp} filter="url(#bloom)" />
      )}

      <g transform={`translate(${cx} ${y + lift}) scale(${look} 1)`}>
        {beamOn && L > 1 && (
          <g>
            <defs>
              <linearGradient id={`beam${Math.round(e.x)}${Math.round(w)}`} x1={ox} y1={0} x2={ox + Math.sign(f) * L} y2={0} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor={C.blue} stopOpacity={0.2} />
                <stop offset="0.7" stopColor={C.blue} stopOpacity={0.09} />
                <stop offset="1" stopColor={C.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={`M${ox} ${oy} L ${ox + Math.sign(f) * L} ${-lift} L ${ox + Math.sign(f) * L} ${oy - 0.035 * L} Z`} fill={`url(#beam${Math.round(e.x)}${Math.round(w)})`} />
            {(() => {
              // scan line sweeping from the top edge to the floor
              const ey = lerp(oy - 0.035 * L, -lift, scanP);
              const op = Math.sin(Math.PI * scanP) * 0.55;
              return <path d={`M${ox} ${oy} L ${ox + Math.sign(f) * L * 0.92} ${lerp(oy, ey, 0.92)}`} stroke={C.blue} strokeWidth={1.6} opacity={op} />;
            })()}
            <circle cx={ox} cy={oy} r={Math.max(2, w * 0.008)} fill={C.blue} opacity={0.8} />
          </g>
        )}

        {/* wheels (half visible under the body) */}
        {[-0.25, 0.25].map((u) => (
          <circle key={u} cx={u * w * bw} cy={-0.035 * w} r={0.035 * w} fill={C.dim} />
        ))}
        {/* side brush */}
        <g stroke={C.dim} strokeWidth={Math.max(1.5, w * 0.005)} strokeLinecap="round" opacity={af * 0.75}>
          {[0, 1, 2].map((k) => {
            const a = spin + (k * 2 * Math.PI) / 3;
            return <path key={k} d={`M${brushX} ${-0.03 * w} l ${Math.cos(a) * 0.06 * w} ${(Math.sin(a) * 0.5 + 0.5) * 0.016 * w}`} />;
          })}
        </g>

        {/* body + lidar turret */}
        <g fill={body} filter={bodyFilter}>
          <rect x={-half} y={top} width={half * 2} height={bottom - top} rx={0.09 * w} ry={0.06 * w} />
          <rect x={fx(-0.1) - 0.11 * w} y={top - 0.06 * w} width={0.22 * w} height={0.06 * w + 2} rx={0.02 * w} />
          {/* bumper seam and sensor window (the face toward the camera mid-turn) */}
          <path d={`M${fx(0.32)} ${top + 0.02 * w} V ${bottom - 0.01 * w}`} stroke={C.bg} strokeWidth={3} opacity={af} />
          <rect x={fx(0.43) - 0.05 * w} y={-0.168 * w} width={0.1 * w * (0.45 + 0.55 * af)} height={0.035 * w} rx={0.012 * w} fill={C.bg} />
        </g>
        {/* status LED on the top front edge */}
        <circle cx={fx(0.36)} cy={top - 0.004 * w} r={0.022 * w} fill={ledColor} opacity={ledOp} filter={ledGlow} />

        {/* tiny impact strokes on each bump */}
        {bumpHits.map((d, i) => {
          const op = 1 - d / 14;
          const bx = fx(0.5) + Math.sign(f) * 8;
          return (
            <g key={i} stroke={C.dim} strokeWidth={3} strokeLinecap="round" opacity={op}>
              <path d={`M${bx} ${-0.2 * w} l ${Math.sign(f) * 14} ${-10}`} />
              <path d={`M${bx} ${-0.1 * w} l ${Math.sign(f) * 14} ${8}`} />
            </g>
          );
        })}
      </g>
    </g>
  );
};
