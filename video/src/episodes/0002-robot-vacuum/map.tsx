// Advisory 0002: the vacuum app's floor map. `MapView` draws the plan in map units
// (house 1000 × 600, 100 units ≈ 1 m) and is shared by the full-frame `vacuum-map` shot,
// the phone screen and the addendum grid. Spec: assets-spec.md → "Shot type: vacuum-map".
import React from "react";
import { C, FONT } from "../../theme";
import { clamp01, ease, easeInOut, lerp, popIn, prog, rand } from "../../anim";
import type { CustomShotProps } from "../../episode-context";
import { CounterNumber } from "../../figures/Marks";
import scenes from "../../../../advisories/0002-robot-vacuum/scenes.json";

type Pt = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type Room = Rect & { k: string; label: string };

export const ROOMS: Room[] = [
  { k: "living", label: "LIVING ROOM", x: 0, y: 0, w: 400, h: 340 },
  { k: "kitchen", label: "KITCHEN", x: 0, y: 340, w: 400, h: 260 },
  { k: "hall", label: "HALLWAY", x: 400, y: 0, w: 170, h: 600 },
  { k: "bath", label: "BATHROOM", x: 570, y: 0, w: 430, h: 210 },
  { k: "bed", label: "BEDROOM", x: 570, y: 210, w: 430, h: 390 },
];
export const EXTRA: Room = { k: "extra", label: "ROOM 6", x: 1000, y: 300, w: 200, h: 200 };
const SOFA: Rect = { x: 60, y: 230, w: 240, h: 80 };
const BED: Rect = { x: 810, y: 380, w: 180, h: 200 };
const DOCK: Pt = { x: 600, y: 560 };
const HALL: Pt = { x: 485, y: 400 };
const DOOR: Pt = { x: 575, y: 340 };
const TRAIL: Pt[] = [
  { x: 1000, y: 420 },
  { x: 930, y: 470 },
  { x: 700, y: 420 },
  DOOR,
  { x: 485, y: 340 },
  { x: 485, y: 480 },
  { x: 400, y: 485 },
  { x: 240, y: 480 },
];
const ROUTE: Pt[] = [HALL, { x: 485, y: 340 }, { x: 600, y: 340 }, { x: 600, y: DOCK.y - 26 }];
const GAP = 3; // half the gap between rooms

// ------------------------------------------------------------------ geometry helpers
const segLens = (path: Pt[]) => path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.y - path[i].y));
const pathLen = (path: Pt[]) => segLens(path).reduce((a, b) => a + b, 0);
function along(path: Pt[], d: number): Pt & { a: number } {
  const L = segLens(path);
  let rest = Math.max(0, d);
  for (let i = 0; i < L.length; i++) {
    if (rest <= L[i] || i === L.length - 1) {
      const f = L[i] ? clamp01(rest / L[i]) : 0;
      return { x: lerp(path[i].x, path[i + 1].x, f), y: lerp(path[i].y, path[i + 1].y, f), a: Math.atan2(path[i + 1].y - path[i].y, path[i + 1].x - path[i].x) };
    }
    rest -= L[i];
  }
  return { ...path[path.length - 1], a: 0 };
}
// The part of a path from distance d0 to d1, as points.
function subPath(path: Pt[], d0: number, d1: number): Pt[] {
  const out: Pt[] = [along(path, d0)];
  let acc = 0;
  const L = segLens(path);
  for (let i = 0; i < L.length; i++) {
    acc += L[i];
    if (acc > d0 && acc < d1) out.push(path[i + 1]);
  }
  out.push(along(path, d1));
  return out;
}
const poly = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
// Distance along a path of its point closest to p.
function distOf(path: Pt[], p: Pt) {
  let best = Infinity, bestD = 0, acc = 0;
  const L = segLens(path);
  for (let i = 0; i < L.length; i++) {
    const a = path[i], b = path[i + 1];
    const f = L[i] ? clamp01(((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (L[i] * L[i])) : 0;
    const q = { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) };
    const dd = Math.hypot(q.x - p.x, q.y - p.y);
    if (dd < best) (best = dd), (bestD = acc + f * L[i]);
    acc += L[i];
  }
  return bestD;
}
const TRAIL_LEN = pathLen(TRAIL);
const TRAIL_DOTS = Array.from({ length: Math.floor(TRAIL_LEN / 26) + 1 }, (_, i) => i * 26);
const D_DOOR = distOf(TRAIL, DOOR);
const D_HALL = distOf(TRAIL, HALL);

// Lawn-mower path through a room (rows every 40 units), plus the cleaned bands so far.
const ROW = 40;
function mowPath(r: Rect): Pt[] {
  const inset = 22;
  const x0 = r.x + inset, x1 = r.x + r.w - inset;
  const n = Math.max(1, Math.round((r.h - 2 * inset) / ROW) + 1);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const y = Math.min(r.y + r.h - inset, r.y + inset + i * ROW);
    const ltr = i % 2 === 0;
    pts.push({ x: ltr ? x0 : x1, y }, { x: ltr ? x1 : x0, y });
  }
  return pts;
}
function cleanedBands(r: Rect, p: number): Rect[] {
  const path = mowPath(r);
  const n = path.length / 2;
  if (p >= 1) return [r];
  if (p <= 0) return [];
  const pos = along(path, p * pathLen(path));
  const rows: Rect[] = [];
  for (let i = 0; i < n; i++) {
    const y = path[i * 2].y;
    const top = i === 0 ? r.y : y - ROW / 2;
    const bot = i === n - 1 ? r.y + r.h : y + ROW / 2;
    if (pos.y > y + 0.5) rows.push({ x: r.x, y: top, w: r.w, h: bot - top });
    else if (Math.abs(pos.y - y) <= 0.5) {
      const ltr = i % 2 === 0;
      const xa = ltr ? r.x : pos.x, xb = ltr ? pos.x : r.x + r.w;
      rows.push({ x: xa, y: top, w: Math.max(0, xb - xa), h: bot - top });
      break;
    } else break;
  }
  return rows;
}

// ------------------------------------------------------------------ fields
export type MapFields = {
  rooms?: "draw-on" | "static";
  clean?: "none" | "all" | "sequence" | "zigzag";
  vacuum?: "hall" | "dock" | "along-trail" | "into-extra" | "none";
  trail?: "visible" | "erase";
  trailFrom?: "door";
  route?: "to-dock";
  extra?: boolean | "appear" | "faint";
  extraLabel?: "type" | "hidden";
  zoom?: "extra" | "living";
  dims?: boolean | "extra";
  highlight?: "sofa" | "bed" | "rooms-sequence" | "trail" | "shared-wall";
  header?: string;
  upload?: boolean;
  dim?: boolean;
  layout?: "grid";
  count?: number;
  countLabel?: string;
};

// A same_as shot inherits its base's map fields (the engine replaces `map` wholesale).
const SHOTS = (scenes as any).shots as Record<string, any>;
export function mapFieldsOf(id: string, own?: MapFields): MapFields {
  const s = SHOTS[id];
  if (!s) return own ?? {};
  const base = s.same_as ? mapFieldsOf(s.same_as) : {};
  return { ...base, ...(s.map ?? {}), ...(own ?? {}) };
}
const baseHeaderOf = (id: string) => (SHOTS[id]?.same_as ? mapFieldsOf(SHOTS[id].same_as).header : undefined);

// Timeline of one map (all in frames since the map appeared).
type Clock = { t: number; dur: number; fps: number; audio: number };
const ORDER = ["living", "kitchen", "hall", "bath", "bed"];
const AREA = (k: string) => {
  const r = ROOMS.find((x) => x.k === k)!;
  return pathLen(mowPath(r));
};
const TOTAL_MOW = ORDER.reduce((s, k) => s + AREA(k), 0);

function schedule(m: MapFields, c: Clock) {
  const { dur, fps } = c;
  const drawOn = m.rooms === "draw-on";
  const roomAt = (i: number) => (drawOn ? fps * (0.1 + 0.3 * i) : -1e9);
  let seq0 = 0, seq1 = 0;
  if (m.clean === "sequence") {
    if (m.vacuum === "into-extra") (seq0 = dur * 0.04), (seq1 = dur * 0.5);
    else (seq0 = drawOn ? fps * 0.45 : dur * 0.05), (seq1 = dur * 0.93);
  }
  let appearAt = fps * 0.15;
  if (m.extra === "appear" && m.vacuum === "into-extra") appearAt = seq1 + fps * 0.15;
  const appearEnd = appearAt + fps * 0.6;
  return { roomAt, seq0, seq1, appearAt, appearEnd };
}

// Position of the mowing dot and each room's progress at frame t of the clean sequence.
function sequenceState(t: number, seq0: number, seq1: number) {
  const p = prog(t, seq0, seq1, (x) => x) * TOTAL_MOW;
  let acc = 0;
  const roomP: Record<string, number> = {};
  let pos: (Pt & { a: number }) | null = null;
  for (const k of ORDER) {
    const r = ROOMS.find((x) => x.k === k)!;
    const L = AREA(k);
    roomP[k] = clamp01((p - acc) / L);
    if (!pos && p <= acc + L) pos = along(mowPath(r), p - acc);
    acc += L;
  }
  if (!pos) {
    const last = mowPath(ROOMS[4]);
    pos = { ...last[last.length - 1], a: 0 };
  }
  return { roomP, pos, started: t >= seq0 };
}

// ------------------------------------------------------------------ pieces
const Stripes: React.FC<{ id: string; rects: Rect[]; opacity?: number }> = ({ id, rects, opacity = 0.3 }) => {
  if (!rects.length) return null;
  const minY = Math.min(...rects.map((r) => r.y)), maxY = Math.max(...rects.map((r) => r.y + r.h));
  const minX = Math.min(...rects.map((r) => r.x)), maxX = Math.max(...rects.map((r) => r.x + r.w));
  const lines: number[] = [];
  for (let y = Math.ceil(minY / 10) * 10 + 5; y < maxY; y += 10) lines.push(y);
  return (
    <g>
      <clipPath id={id}>
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} />
        ))}
      </clipPath>
      <g clipPath={`url(#${id})`} stroke={C.blue} strokeWidth={1.5} opacity={opacity}>
        {lines.map((y) => (
          <path key={y} d={`M${minX} ${y} H ${maxX}`} />
        ))}
      </g>
    </g>
  );
};

const VacDot: React.FC<{ p: Pt; a?: number; opacity?: number; pulse?: number; r?: number }> = ({ p, a = -Math.PI / 2, opacity = 1, pulse = 0, r = 14 }) => (
  <g opacity={opacity}>
    {pulse > 0 && <circle cx={p.x} cy={p.y} r={r + 6 + pulse * 26} fill="none" stroke={C.blue} strokeWidth={2} opacity={(1 - pulse) * 0.7} />}
    <circle cx={p.x} cy={p.y} r={r} fill={C.fg} filter="url(#glow)" />
    <path d={`M${p.x} ${p.y} L ${p.x + Math.cos(a) * (r + 9)} ${p.y + Math.sin(a) * (r + 9)}`} stroke={C.blue} strokeWidth={2.5} strokeLinecap="round" />
  </g>
);

const DockMark: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g>
    <rect x={DOCK.x - 13 * s} y={DOCK.y - 13 * s} width={26 * s} height={26 * s} rx={3} fill={C.surface} stroke={C.line} strokeWidth={2} />
    <circle cx={DOCK.x} cy={DOCK.y} r={4 * s} fill={C.blue} filter="url(#glowBlue)" />
  </g>
);

// Dimension line with end ticks and a centred mono label (map units).
const Dim: React.FC<{ a: Pt; b: Pt; label: string; p: number; side: -1 | 1; fs: number }> = ({ a, b, label, p, side, fs }) => {
  const horiz = Math.abs(a.y - b.y) < 1;
  const e = { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) };
  const tick = (q: Pt) => (horiz ? `M${q.x} ${q.y - 8} V ${q.y + 8}` : `M${q.x - 8} ${q.y} H ${q.x + 8}`);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  return (
    <g stroke={C.dim} strokeWidth={1.5}>
      <path d={`M${a.x} ${a.y} L ${e.x} ${e.y}`} />
      <path d={tick(a)} />
      {p >= 1 && <path d={tick(b)} />}
      <text
        x={horiz ? mid.x : mid.x + side * 12}
        y={horiz ? mid.y + side * 12 + (side > 0 ? fs * 0.7 : 0) : mid.y + fs * 0.35}
        textAnchor={horiz ? "middle" : side > 0 ? "start" : "end"}
        fontFamily={FONT.mono}
        fontWeight={500}
        fontSize={fs}
        letterSpacing="0.12em"
        fill={C.fg}
        stroke="none"
        opacity={clamp01((p - 0.6) / 0.4)}
      >
        {label}
      </text>
    </g>
  );
};

// ------------------------------------------------------------------ the map
export type MapMode = "full" | "phone" | "mini";

export const MapView: React.FC<{ m: MapFields; c: Clock; mode?: MapMode; zoom?: number; uid: string; moving?: boolean }> = ({ m, c, mode = "full", zoom = 1, uid, moving }) => {
  const { t, dur, fps } = c;
  const sch = schedule(m, c);
  const showText = mode === "full";
  const fs = 20 * Math.min(1, 1.5 / zoom);
  const roomsShown = ROOMS.map((_, i) => t >= sch.roomAt(i));

  // --- cleaning
  const seq = m.clean === "sequence" ? sequenceState(t, sch.seq0, sch.seq1) : null;
  const zig = m.clean === "zigzag" ? prog(t, dur * 0.05, dur * 0.95, (x) => x) : 0;
  const living = ROOMS[0];
  const cleaned: Rect[] = [];
  if (m.clean === "all") cleaned.push(...ROOMS);
  if (seq) for (const r of ROOMS) cleaned.push(...cleanedBands(r, seq.roomP[r.k] ?? 0));
  if (m.clean === "zigzag") cleaned.push(...cleanedBands(living, zig));

  // --- extra room
  const extraOn = m.extra === true || m.extra === "faint" || (m.extra === "appear" && t >= sch.appearAt);
  const extraScale = m.extra === "appear" ? prog(t, sch.appearAt, sch.appearEnd, easeInOut) : 1;
  const pulses = m.extra === "appear" ? Math.max(0, Math.sin(clamp01((t - sch.appearEnd) / (fps * 1.2)) * Math.PI * 2)) * (t < sch.appearEnd + fps * 1.2 ? 1 : 0) : 0;
  const extraOp = m.extra === "faint" ? 0.3 : 1;

  // --- vacuum dot
  const vac = m.vacuum ?? (m.clean === "sequence" || m.clean === "zigzag" ? undefined : "dock");
  let dot: (Pt & { a: number }) | null = null;
  let dotOp = 1;
  let pulse = 0;
  let trailCut = 0; // dots before this distance are gone
  let travelled: Pt[] | null = null;
  const d0 = m.trailFrom === "door" ? D_DOOR : 0;
  if (seq && seq.started) dot = seq.pos;
  if (m.clean === "zigzag") dot = along(mowPath(living), zig * pathLen(mowPath(living)));
  if (vac === "hall") {
    const hy = moving ? lerp(120, 470, prog(t, 0, dur, easeInOut)) : HALL.y;
    dot = { x: HALL.x, y: hy, a: Math.PI / 2 };
    if (!moving) pulse = (t % (fps * 1.4)) / (fps * 1.4);
  }
  if (vac === "dock" && !m.route) dot = { x: DOCK.x, y: DOCK.y - 26, a: -Math.PI / 2 };
  if (vac === "along-trail") {
    const d = lerp(d0, TRAIL_LEN, prog(t, dur * 0.06, dur * 0.92, easeInOut));
    dot = along(TRAIL, d);
    trailCut = d + 4;
    travelled = subPath(TRAIL, d0, d);
  }
  if (vac === "into-extra" && seq) {
    const last = mowPath(ROOMS[4]);
    const from = last[last.length - 1];
    const pIn = prog(t, sch.appearEnd + fps * 0.2, sch.appearEnd + fps * 0.2 + dur * 0.16, easeInOut);
    if (pIn > 0) {
      const path = [from, { x: 960, y: 400 }, { x: 1100, y: 400 }];
      dot = along(path, pIn * pathLen(path));
      dotOp = 1 - prog(t, sch.appearEnd + fps * 0.2 + dur * 0.16, sch.appearEnd + fps * 0.2 + dur * 0.26, (x) => x);
    }
  }
  let routeP = 0;
  if (m.route === "to-dock") {
    routeP = prog(t, dur * 0.04, dur * 0.4, easeInOut);
    const follow = prog(t, dur * 0.22, dur * 0.88, easeInOut);
    dot = along(ROUTE, follow * pathLen(ROUTE));
  }
  // Room 6 is only ever cleaned when the new vacuum drives into it (S80).
  const extraCleaned = vac === "into-extra" && dot ? clamp01((dot.x - 1000) / 100) : 0;

  // --- trail dots: the remaining part after the hall when it was sent home
  const trailStart = m.trail === "visible" && (vac === "dock" || m.route) ? D_HALL : d0;
  const trailDots = m.trail ? TRAIL_DOTS.filter((d) => d >= trailStart - 1 && d >= trailCut) : [];
  const trailRed = m.highlight === "trail" ? Math.sin(Math.PI * prog(t, dur * 0.15, dur * 0.65, (x) => x)) : 0;

  // --- highlights
  const pulse2 = (a: number, b: number) => Math.max(0, Math.sin(clamp01((t - a) / (b - a)) * Math.PI * 4)) * (t > a && t < b ? 1 : 0);
  const sofaHi = m.highlight === "sofa" ? pulse2(fps * 0.15, Math.max(fps * 1.6, dur * 0.8)) : 0;
  const bedRing = m.highlight === "bed" ? prog(t, fps * 0.2, fps * 0.9, (x) => x) : 0;
  const wallHi = m.highlight === "shared-wall" ? 0.45 + 0.55 * pulse2(fps * 0.2, Math.max(fps * 1.8, dur * 0.8)) : 0;
  const seqSlot = Math.max(1, (c.audio || dur) * 0.98) / 5;
  const litRoom = (i: number) => {
    if (m.highlight !== "rooms-sequence") return 0;
    const a = i * seqSlot;
    return prog(t, a, a + 4, (x) => x) * (1 - prog(t, a + seqSlot, a + seqSlot + 8, (x) => x) * 0.75);
  };

  return (
    <g>
      {/* rooms */}
      {ROOMS.map((r, i) => {
        if (!roomsShown[i]) return null;
        const a = sch.roomAt(i);
        const drawP = m.rooms === "draw-on" ? prog(t, a, a + fps * 0.35, (x) => x) : 1;
        const fillP = m.rooms === "draw-on" ? prog(t, a + fps * 0.25, a + fps * 0.5, (x) => x) : 1;
        const per = 2 * (r.w + r.h - 4 * GAP);
        const lit = litRoom(i);
        const hiBlue = r.k === "living" ? sofaHi : 0;
        const stroke = lit > 0.01 ? C.fg : hiBlue > 0.01 ? C.blue : C.line;
        return (
          <g key={r.k}>
            <rect x={r.x + GAP} y={r.y + GAP} width={r.w - 2 * GAP} height={r.h - 2 * GAP} rx={6} fill={C.surface2} opacity={fillP} />
            <rect
              x={r.x + GAP}
              y={r.y + GAP}
              width={r.w - 2 * GAP}
              height={r.h - 2 * GAP}
              rx={6}
              fill="none"
              stroke={stroke}
              strokeWidth={lit > 0.01 || hiBlue > 0.01 ? 2 + 1.5 * Math.max(lit, hiBlue) : 2}
              strokeDasharray={drawP < 1 ? `${per * drawP} ${per}` : undefined}
              opacity={lit > 0.01 ? 0.55 + 0.45 * lit : hiBlue > 0.01 ? 0.5 + 0.5 * hiBlue : 1}
              filter={lit > 0.3 ? "url(#glowSoft)" : hiBlue > 0.3 ? "url(#glowBlue)" : undefined}
            />
            {showText && (
              <text x={r.x + (r.k === "bed" ? 50 : 14)} y={r.y + r.h - 14} fontFamily={FONT.mono} fontWeight={500} fontSize={fs} letterSpacing="0.18em" fill={lit > 0.3 ? C.fg : C.dim} opacity={fillP}>
                {r.label}
              </text>
            )}
          </g>
        );
      })}

      {/* cleaned stripes */}
      <Stripes id={`clean-${uid}`} rects={cleaned} />

      {/* furniture */}
      {roomsShown[0] && (
        <rect x={SOFA.x} y={SOFA.y} width={SOFA.w} height={SOFA.h} rx={18} fill={C.surface} stroke={sofaHi > 0.01 ? C.blue : C.line} strokeWidth={2 + 1.5 * sofaHi} filter={sofaHi > 0.3 ? "url(#glowBlue)" : undefined} />
      )}
      {roomsShown[0] && <path d={`M${SOFA.x + 14} ${SOFA.y + 22} H ${SOFA.x + SOFA.w - 14}`} stroke={sofaHi > 0.01 ? C.blue : C.line} strokeWidth={1.5} opacity={0.8} />}
      {roomsShown[4] && (
        <g>
          <rect x={BED.x} y={BED.y} width={BED.w} height={BED.h} rx={6} fill={C.surface} stroke={C.line} strokeWidth={2} />
          <path d={`M${BED.x + BED.w - 34} ${BED.y + 10} V ${BED.y + BED.h - 10}`} stroke={C.line} strokeWidth={2} />
          <path d={`M${BED.x + 14} ${BED.y + 64} H ${BED.x + BED.w - 34}`} stroke={C.line} strokeWidth={1.5} opacity={0.6} />
          <DockMark />
        </g>
      )}

      {/* room 6: outside the house outline, attached to the bedroom's right wall */}
      {extraOn && (
        <g opacity={extraOp} transform={`translate(${EXTRA.x} 0) scale(${extraScale} 1) translate(${-EXTRA.x} 0)`}>
          <rect x={EXTRA.x + GAP} y={EXTRA.y + GAP} width={EXTRA.w - 2 * GAP} height={EXTRA.h - 2 * GAP} rx={6} fill={C.surface} />
          {extraCleaned > 0 && <Stripes id={`x6-${uid}`} rects={[{ x: EXTRA.x, y: EXTRA.y, w: EXTRA.w * extraCleaned, h: EXTRA.h }]} />}
          <rect
            x={EXTRA.x + GAP}
            y={EXTRA.y + GAP}
            width={EXTRA.w - 2 * GAP}
            height={EXTRA.h - 2 * GAP}
            rx={6}
            fill="none"
            stroke={C.red}
            strokeWidth={2 + 2 * pulses}
            strokeDasharray="10 7"
            filter={pulses > 0.2 || mode === "mini" ? "url(#glowRed)" : undefined}
          />
          {(showText || mode === "phone") && m.extraLabel !== "hidden" && (() => {
            const text = EXTRA.label;
            const startT = (zoom > 1.01 ? fps * 0.95 : fps * 0.2);
            const n = m.extraLabel === "type" ? Math.floor(clamp01((t - startT) / (fps * 0.9)) * (text.length + 0.99)) : text.length;
            const caret = m.extraLabel === "type" && n < text.length + 1 && t > startT - fps * 0.4 && Math.floor(t / 8) % 2 === 0;
            const lfs = mode === "phone" ? 34 : fs;
            const tx = EXTRA.x + 14, ty = EXTRA.y + EXTRA.h - 14;
            return (
              <g>
                <text x={tx} y={ty} fontFamily={FONT.mono} fontWeight={500} fontSize={lfs} letterSpacing="0.18em" fill={C.red}>
                  {text.slice(0, n)}
                </text>
                {caret && <rect x={tx + n * lfs * 0.6 * 1.18 + 2} y={ty - lfs * 0.8} width={lfs * 0.55} height={lfs * 0.95} fill={C.red} opacity={0.8} />}
              </g>
            );
          })()}
        </g>
      )}

      {/* shared wall between the bedroom and room 6 */}
      {wallHi > 0 && <path d={`M1000 ${EXTRA.y + 4} V ${EXTRA.y + EXTRA.h - 4}`} stroke={C.red} strokeWidth={4 + 4 * wallHi} opacity={0.35 + 0.65 * wallHi} filter="url(#glowRed)" strokeLinecap="round" />}
      {bedRing > 0 && (
        <ellipse
          cx={BED.x + BED.w / 2}
          cy={BED.y + BED.h / 2}
          rx={BED.w * 0.72}
          ry={BED.h * 0.66}
          fill="none"
          stroke={C.red}
          strokeWidth={3}
          strokeDasharray={`${bedRing * 1100} 1100`}
          transform={`rotate(-90 ${BED.x + BED.w / 2} ${BED.y + BED.h / 2})`}
          filter="url(#glowRed)"
          strokeLinecap="round"
        />
      )}

      {/* the path the vacuum has driven, and the dust it has not reached yet */}
      {travelled && travelled.length > 1 && (
        <g>
          <path d={poly(travelled)} stroke={C.blue} strokeWidth={14} opacity={0.14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={poly(travelled)} stroke={C.blue} strokeWidth={2.5} opacity={0.85} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {trailDots.map((d) => {
        const p = along(TRAIL, d);
        return (
          <circle key={d} cx={p.x} cy={p.y} r={mode === "phone" ? 7 : 5} fill={trailRed > 0.02 ? C.red : C.dim} opacity={trailRed > 0.02 ? 0.6 + 0.4 * trailRed : 0.9} filter={trailRed > 0.4 ? "url(#glowRed)" : undefined} />
        );
      })}
      {m.route === "to-dock" && routeP > 0 && (
        <path d={poly(subPath(ROUTE, 0, routeP * pathLen(ROUTE)))} stroke={C.blue} strokeWidth={3} strokeDasharray="12 10" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#glowBlue)" />
      )}
      {m.clean === "zigzag" && zig > 0 && (
        <path d={poly(subPath(mowPath(living), 0, zig * pathLen(mowPath(living))))} stroke={C.blue} strokeWidth={2} opacity={0.7} fill="none" strokeLinejoin="round" />
      )}

      {dot && vac !== "none" && <VacDot p={dot} a={dot.a} opacity={dotOp} pulse={pulse} r={mode === "phone" ? 22 : 14} />}
    </g>
  );
};

// ------------------------------------------------------------------ full-frame shot
// Placement: the house at scale 1.0 inside the scene zone (y 150–820), left edge 460, so
// room 6 (x 1000–1200) still fits on the right and nothing reaches the caption zone.
const MS = 1.0;
const OX = 460, OY = 196;
const SX = (u: number) => OX + u * MS, SY = (u: number) => OY + u * MS;

const DotGrid: React.FC = () => (
  <g fill={C.line} opacity={0.12}>
    {Array.from({ length: 33 }, (_, j) =>
      Array.from({ length: 64 }, (_, i) => <circle key={`${i}-${j}`} cx={15 + i * 30} cy={15 + j * 33} r={1.6} />),
    )}
  </g>
);

const Header: React.FC<{ text: string; x: number; y: number; flicker?: number }> = ({ text, x, y, flicker = 1 }) => {
  const i = text.indexOf("6 ROOMS");
  const base = { fontFamily: FONT.mono, fontWeight: 500, fontSize: 22, letterSpacing: "0.2em" } as const;
  return (
    <text x={x} y={y} {...base} fill={C.dim} opacity={flicker}>
      {i < 0 ? (
        text
      ) : (
        <>
          {text.slice(0, i)}
          <tspan fill={C.red}>{text.slice(i, i + 7)}</tspan>
          {text.slice(i + 7)}
        </>
      )}
    </text>
  );
};

function zoomTarget(z?: string) {
  if (z === "extra") return { s: 2.4, cx: EXTRA.x + EXTRA.w / 2 - 40, cy: EXTRA.y + EXTRA.h / 2 };
  if (z === "living") return { s: 1.75, cx: 200, cy: 170 };
  return { s: 1, cx: 500, cy: 300 };
}

const GridShot: React.FC<{ m: MapFields; frame: number; dur: number; fps: number }> = ({ m, frame, dur, fps }) => {
  const cols = 6, rows = 4;
  const cw = 292, ch = 162;
  const x0 = 960 - (cols * cw) / 2, y0 = 160;
  const n = cols * rows;
  const count = m.count ?? 0;
  const v = lerp(0, count, prog(frame, dur * 0.05, dur * 0.7, ease));
  return (
    <g>
      {Array.from({ length: n }, (_, k) => {
        const i = k % cols, j = Math.floor(k / cols);
        const at = (k / n) * dur * 0.6;
        const pi = popIn(frame, at);
        if (pi.opacity <= 0) return null;
        const mirror = rand(k * 3.3 + 1) > 0.5 ? -1 : 1;
        const rot = (rand(k * 7.1 + 2) * 2 - 1) * 3;
        const s = 0.205 * pi.scale;
        const cx = x0 + i * cw + cw / 2, cy = y0 + j * ch + ch / 2;
        return (
          <g key={k} opacity={pi.opacity * 0.85} transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${s * mirror} ${s}) translate(-600 -300)`}>
            <MapView m={{ rooms: "static", clean: "none", extra: true, vacuum: "none" }} c={{ t: frame - at + k * 7, dur, fps, audio: 0 }} mode="mini" uid={`g${k}`} />
            <rect x={EXTRA.x} y={EXTRA.y} width={EXTRA.w} height={EXTRA.h} rx={8} fill={C.red} opacity={0.12 + 0.12 * Math.sin((frame - at) / 9 + k)} />
          </g>
        );
      })}
      <g opacity={prog(frame, 4, 14)}>
        <rect x={960 - 300} y={330} width={600} height={290} rx={22} fill={C.bg} opacity={0.88} stroke={C.line} strokeWidth={2} />
        <CounterNumber x={960} y={505} value={v} size={200} label={m.countLabel} />
      </g>
    </g>
  );
};

export const VacuumMapShot: React.FC<CustomShotProps> = ({ shot, frame, dur, fps, audioFrames }) => {
  const m = mapFieldsOf(shot.id, undefined);
  const drift = lerp(1, 1.012, frame / Math.max(1, dur));
  if (m.layout === "grid") {
    return (
      <g>
        <DotGrid />
        <g transform={`translate(960 490) scale(${drift}) translate(-960 -490)`}>
          <GridShot m={m} frame={frame} dur={dur} fps={fps} />
        </g>
      </g>
    );
  }
  const zt = zoomTarget(m.zoom);
  const zp = m.zoom ? prog(frame, fps * 0.05, fps * 0.85, easeInOut) : 0;
  const zs = lerp(1, zt.s, zp);
  const zcx = lerp(500, zt.cx, zp), zcy = lerp(300, zt.cy, zp);
  // Header: when the room count changes on screen, show the old count first, then flip.
  let header = m.header;
  let flicker = 1;
  if (header && header.includes("6 ROOMS")) {
    const sch = schedule(m, { t: frame, dur, fps, audio: audioFrames });
    const prev = baseHeaderOf(shot.id);
    const flipAt = m.extra === "appear" ? sch.appearEnd : prev && !prev.includes("6 ROOMS") ? fps * 0.4 : -1;
    if (flipAt >= 0 && frame < flipAt) header = header.replace("6 ROOMS", m.extra === "appear" && m.vacuum === "into-extra" ? "CLEANING" : "5 ROOMS");
    if (flipAt >= 0 && frame >= flipAt && frame < flipAt + 6) flicker = [0.2, 1, 0.3, 1, 0.6, 1][frame - flipAt];
  }
  const dimOp = m.dim ? 0.7 : 1;
  const dimsP = (i: number) => prog(frame, fps * (0.2 + i * 0.22), fps * (0.2 + i * 0.22) + 14, (x) => x);
  const dimsExtraP = (i: number) => prog(frame, fps * (0.95 + i * 0.35), fps * (0.95 + i * 0.35) + 16, (x) => x);
  const up = m.upload ? prog(frame, fps * 0.2, Math.max(fps * 0.6, dur * 0.92), (x) => x) : 0;
  return (
    <g>
      <DotGrid />
      <defs>
        <linearGradient id={`zone-${shot.id}`} x1={0} y1={0} x2={0} y2={1080} gradientUnits="userSpaceOnUse">
          <stop offset={108 / 1080} stopColor="#fff" stopOpacity={0} />
          <stop offset={150 / 1080} stopColor="#fff" stopOpacity={1} />
          <stop offset={800 / 1080} stopColor="#fff" stopOpacity={1} />
          <stop offset={842 / 1080} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`zm-${shot.id}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
          <rect width={1920} height={1080} fill={`url(#zone-${shot.id})`} />
        </mask>
      </defs>
      <g transform={`translate(960 ${OY + 300}) scale(${drift}) translate(-960 ${-(OY + 300)})`}>
        <g mask={m.zoom ? `url(#zm-${shot.id})` : undefined}>
        <g opacity={dimOp} transform={`translate(${SX(500)} ${SY(300)}) scale(${zs * MS}) translate(${-zcx} ${-zcy})`}>
          <MapView m={m} c={{ t: frame, dur, fps, audio: audioFrames }} zoom={zs} uid={shot.id} />
          {m.dims === true && (
            <g>
              <Dim a={{ x: 0, y: -22 }} b={{ x: 400, y: -22 }} label="4.0 m" p={dimsP(0)} side={-1} fs={18} />
              <Dim a={{ x: 400, y: -22 }} b={{ x: 570, y: -22 }} label="1.7 m" p={dimsP(1)} side={-1} fs={18} />
              <Dim a={{ x: 570, y: -22 }} b={{ x: 1000, y: -22 }} label="4.3 m" p={dimsP(2)} side={-1} fs={18} />
              <Dim a={{ x: -26, y: 0 }} b={{ x: -26, y: 340 }} label="3.4 m" p={dimsP(3)} side={-1} fs={18} />
              <Dim a={{ x: -26, y: 340 }} b={{ x: -26, y: 600 }} label="2.6 m" p={dimsP(4)} side={-1} fs={18} />
              <Dim a={{ x: 1026, y: 0 }} b={{ x: 1026, y: 600 }} label="6.0 m" p={dimsP(5)} side={1} fs={18} />
              <text x={1026 + 12} y={-20} fontFamily={FONT.mono} fontWeight={500} fontSize={18} letterSpacing="0.12em" fill={C.dim} opacity={dimsP(6)}>
                10.0 × 6.0 m
              </text>
            </g>
          )}
          {m.dims === "extra" && (
            <g>
              <Dim a={{ x: 1000, y: EXTRA.y - 22 }} b={{ x: 1200, y: EXTRA.y - 22 }} label="2.0 m" p={dimsExtraP(0)} side={-1} fs={12} />
              <Dim a={{ x: 1222, y: EXTRA.y }} b={{ x: 1222, y: EXTRA.y + 200 }} label="2.0 m" p={dimsExtraP(1)} side={1} fs={12} />
            </g>
          )}
        </g>
        </g>
        {header && <Header text={header} x={OX} y={OY - 64} flicker={flicker} />}
        {m.upload && (
          <g>
            <rect x={OX} y={OY + 616} width={700} height={4} fill={C.line} opacity={0.6} />
            <rect x={OX} y={OY + 616} width={700 * up} height={4} fill={C.blue} filter="url(#glowBlue)" />
            <text x={OX + 724} y={OY + 623} fontFamily={FONT.mono} fontWeight={500} fontSize={18} letterSpacing="0.2em" fill={C.dim}>
              {up < 1 ? `UPLOADING MAP · ${Math.floor(up * 100)}%` : "UPLOADING MAP · DONE"}
            </text>
          </g>
        )}
      </g>
    </g>
  );
};
