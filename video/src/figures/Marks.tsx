// Marks and annotations: gaze, cross/check/circle, eye, label, bubbles, boundary,
// glow, checklist, counter number, and the high-angle room (room-iso).
import React from "react";
import { C, FONT, DISPLAY_STYLE } from "../theme";
import { clamp01, lerp, rand } from "../anim";
import { Cat } from "./Cat";
import { PersonBody, POSES } from "./Person";
import { Sofa, Bookcase, FloorLamp } from "./Props";

type Pt = { x: number; y: number };

// Dotted line (6 px dots, 14 px gaps), revealed from `from` to `to` by `p`.
export const Gaze: React.FC<{ from: Pt; to: Pt; p: number; color: string; size?: number; gap?: number; opacity?: number }> = ({ from, to, p, color, size = 6, gap = 14, opacity = 1 }) => {
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  const step = size + gap;
  const n = Math.floor(len / step);
  const shown = Math.floor((n + 1) * clamp01(p));
  return (
    <g fill={color} opacity={opacity}>
      {Array.from({ length: shown }, (_, i) => {
        const f = (i * step + size) / len;
        return <circle key={i} cx={from.x + dx * f} cy={from.y + dy * f} r={size / 2} />;
      })}
    </g>
  );
};

export const MarkShape: React.FC<{ type: string; x: number; y: number; size: number; color: string; p: number; scale?: number; opacity?: number }> = ({ type, x, y, size, color, p, scale = 1, opacity = 1 }) => {
  const sw = type === "cross" ? Math.max(8, size * 0.085) : type === "check" ? Math.max(8, size * 0.12) : Math.max(5, size * 0.06);
  const filter = color === C.red ? "url(#glowRed)" : "url(#glowBlue)";
  const draw = (d: string, len: number, t: number, key: string) => (
    <path key={key} d={d} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={len} strokeDashoffset={len * (1 - clamp01(t))} />
  );
  const h = size / 2;
  let body: React.ReactNode = null;
  if (type === "cross") {
    const L = Math.SQRT2 * size;
    body = [draw(`M${x - h} ${y - h} L ${x + h} ${y + h}`, L, p * 2, "a"), draw(`M${x + h} ${y - h} L ${x - h} ${y + h}`, L, p * 2 - 1, "b")];
  } else if (type === "check") {
    const d = `M${x - h * 0.8} ${y} L ${x - h * 0.2} ${y + h * 0.6} L ${x + h * 0.9} ${y - h * 0.6}`;
    body = draw(d, size * 2.2, p, "c");
  } else {
    const r = h;
    body = <circle cx={x} cy={y} r={r} stroke={color} strokeWidth={sw} fill="none" strokeDasharray={2 * Math.PI * r} strokeDashoffset={2 * Math.PI * r * (1 - clamp01(p))} transform={`rotate(-90 ${x} ${y})`} />;
  }
  return (
    <g filter={filter} opacity={opacity} transform={`translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})`}>
      {body}
    </g>
  );
};

export const EyeIcon: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => {
  const h = w * 0.36;
  const d = `M${x - w / 2} ${y} Q ${x} ${y - h * 1.45} ${x + w / 2} ${y} Q ${x} ${y + h * 1.45} ${x - w / 2} ${y} Z`;
  return (
    <g filter="url(#glow)">
      <path d={d} fill="none" stroke={C.fg} strokeWidth={w * 0.035} strokeLinejoin="round" />
      <circle cx={x} cy={y} r={h * 0.72} fill={C.fg} />
      <circle cx={x} cy={y} r={h * 0.3} fill={C.bg} />
      <circle cx={x + h * 0.26} cy={y - h * 0.26} r={h * 0.11} fill={C.fg} />
    </g>
  );
};

// Thin leader line from the anchor to a short mono label.
export const Label: React.FC<{ target: Pt; text: string; color: string; p: number; dx: number; dy: number; align: "start" | "end" }> = ({ target, text, color, p, dx, dy, align }) => {
  const elbow = { x: target.x + dx * 0.55, y: target.y + dy };
  const end = { x: target.x + dx, y: target.y + dy };
  const l1 = Math.hypot(elbow.x - target.x, elbow.y - target.y);
  const l2 = Math.abs(end.x - elbow.x);
  const total = l1 + l2;
  const tp = clamp01(p * 1.4);
  const textP = clamp01((p - 0.6) / 0.4);
  const chars = Math.round(text.length * textP);
  return (
    <g>
      <circle cx={target.x} cy={target.y} r={6} fill={color} opacity={clamp01(p * 4)} filter="url(#glowBlue)" />
      <path d={`M${target.x} ${target.y} L ${elbow.x} ${elbow.y} L ${end.x} ${end.y}`} stroke={color} strokeWidth={2} fill="none" strokeDasharray={total} strokeDashoffset={total * (1 - tp)} />
      <text x={end.x + (align === "start" ? 12 : -12)} y={end.y + 8} textAnchor={align} fontFamily={FONT.mono} fontWeight={500} fontSize={24} letterSpacing="0.14em" fill={color}>
        {text.slice(0, chars)}
      </text>
    </g>
  );
};

export const Bubble: React.FC<{ x: number; y: number; text: string; from?: Pt; small?: boolean; outlineOnly?: boolean; thought?: boolean; opacity?: number; scale?: number }> = ({ x, y, text, from, small, outlineOnly, thought, opacity = 1, scale = 1 }) => {
  const fs = small ? 30 : text.length <= 1 ? 76 : 52;
  const w = Math.max(small ? 120 : 150, text.length * fs * 0.55 + (small ? 50 : 80));
  const h = small ? 64 : 110;
  const fill = outlineOnly ? "none" : C.fg;
  const stroke = outlineOnly ? C.dim : C.fg;
  // Tail points toward the speaker.
  const tx = from ? lerp(x, from.x, 0.32) : x - w * 0.25;
  const ty = from ? y + h / 2 + Math.min(60, Math.max(26, (from.y - y) * 0.3)) : y + h / 2 + 34;
  const baseX = Math.max(x - w / 2 + 30, Math.min(x + w / 2 - 30, from ? lerp(x, from.x, 0.15) : x - w * 0.15));
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})`} filter={outlineOnly ? undefined : "url(#glowSoft)"}>
      {thought ? (
        <>
          <circle cx={lerp(baseX, tx, 0.5)} cy={lerp(y + h / 2, ty, 0.55)} r={11} fill={fill} stroke={stroke} strokeWidth={3} />
          <circle cx={tx} cy={ty + 8} r={7} fill={fill} stroke={stroke} strokeWidth={3} />
          <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} strokeWidth={3} />
        </>
      ) : (
        <path
          d={`M${x - w / 2 + h / 2} ${y - h / 2} H ${x + w / 2 - h / 2} A ${h / 2} ${h / 2} 0 0 1 ${x + w / 2 - h / 2} ${y + h / 2} H ${baseX + 18} L ${tx} ${ty} L ${baseX - 10} ${y + h / 2} H ${x - w / 2 + h / 2} A ${h / 2} ${h / 2} 0 0 1 ${x - w / 2 + h / 2} ${y - h / 2} Z`}
          fill={fill}
          stroke={stroke}
          strokeWidth={outlineOnly ? 3 : 2}
          strokeLinejoin="round"
          strokeDasharray={outlineOnly ? "1 0" : undefined}
        />
      )}
      {text && (
        <text x={x} y={y + fs * 0.36} textAnchor="middle" fontFamily={FONT.caption} fontWeight={600} fontSize={fs} fill={C.bg} letterSpacing={text.includes("•") ? "0.1em" : "0"}>
          {text}
        </text>
      )}
    </g>
  );
};

export const Boundary: React.FC<{ pts: Pt[]; p: number; color?: string }> = ({ pts, p, color = C.blue }) => {
  const d = pts.map((q, i) => `${i ? "L" : "M"}${q.x} ${q.y}`).join(" ");
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const id = `bm${Math.round(pts[0].x)}${Math.round(pts[0].y)}`;
  return (
    <g filter="url(#glowBlue)">
      <mask id={id} maskUnits="userSpaceOnUse">
        <path d={d} stroke="#fff" strokeWidth={14} fill="none" strokeDasharray={len} strokeDashoffset={len * (1 - clamp01(p))} strokeLinecap="round" />
      </mask>
      <path d={d} stroke={color} strokeWidth={5} fill="none" strokeDasharray="22 14" strokeLinecap="round" mask={`url(#${id})`} />
    </g>
  );
};

export const GlowEl: React.FC<{ x: number; y: number; r: number; color: string; opacity: number }> = ({ x, y, r, color, opacity }) => {
  const id = `gl${Math.round(x)}${Math.round(y)}`;
  return (
    <g>
      <defs>
        <radialGradient id={id} cx={x} cy={y} r={r} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color} stopOpacity={opacity} />
          <stop offset="0.5" stopColor={color} stopOpacity={opacity * 0.45} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
    </g>
  );
};

// Clipboard-style paper card with checkbox rows.
export const Checklist: React.FC<{ x: number; y: number; w: number; title?: string; items: string[]; tick?: number; tickP?: number; tickColor?: string; big?: boolean }> = ({ x, y, w, items, tick, tickP = 0, tickColor = C.blue, big }) => {
  const fs = big ? 40 : 22;
  const rowH = big ? 110 : 52;
  const padTop = big ? 120 : 74;
  const longest = Math.max(...items.map((s) => s.replace(/[✓☐]/g, "").trim().length));
  w = Math.max(w, longest * fs * 0.6 * 1.04 + (big ? 54 + 28 + 100 : 26 + 14 + 48));
  const h = padTop + items.length * rowH + (big ? 70 : 34);
  const l = x - w / 2, t = y - h / 2;
  return (
    <g transform={`rotate(${big ? -1 : 2} ${x} ${y})`}>
      <rect x={l - 14} y={t - 14} width={w + 28} height={h + 28} rx={10} fill="#3A3128" stroke="#2A231C" strokeWidth={3} />
      <rect x={l} y={t} width={w} height={h} fill={C.paper} />
      <rect x={x - w * 0.18} y={t - 26} width={w * 0.36} height={big ? 46 : 32} rx={6} fill="#8A929C" stroke="#5E6670" strokeWidth={2} />
      <text x={l + (big ? 50 : 24)} y={t + (big ? 76 : 46)} fontFamily={FONT.mono} fontWeight={600} fontSize={big ? 28 : 16} letterSpacing="0.16em" fill={C.ink}>
        {big ? "INSPECTION RECORD · UR-12" : "INSPECTION · UR-12"}
      </text>
      <path d={`M${l + (big ? 50 : 24)} ${t + (big ? 92 : 58)} H ${l + w - (big ? 50 : 24)}`} stroke={C.ink} strokeWidth={1.5} opacity={0.5} />
      {items.map((raw, i) => {
        const done = raw.includes("✓");
        const label = raw.replace(/[✓☐]/g, "").trim();
        const ry = t + padTop + i * rowH + rowH / 2;
        const bx = l + (big ? 50 : 24);
        const bs = big ? 54 : 26;
        const isTick = tick === i;
        return (
          <g key={i}>
            <rect x={bx} y={ry - bs / 2} width={bs} height={bs} fill="none" stroke={C.ink} strokeWidth={big ? 3 : 2} />
            <text x={bx + bs + (big ? 28 : 14)} y={ry + fs * 0.36} fontFamily={FONT.mono} fontWeight={big ? 500 : 400} fontSize={fs} fill={C.ink} letterSpacing="0.04em">
              {label}
            </text>
            {done && <path d={`M${bx + bs * 0.18} ${ry} L ${bx + bs * 0.42} ${ry + bs * 0.26} L ${bx + bs * 0.86} ${ry - bs * 0.3}`} stroke={C.ink} strokeWidth={big ? 5 : 3} fill="none" strokeLinecap="round" />}
            {isTick && (
              <path d={`M${bx + bs * 0.12} ${ry} L ${bx + bs * 0.42} ${ry + bs * 0.32} L ${bx + bs * 1.02} ${ry - bs * 0.46}`} stroke={tickColor} strokeWidth={big ? 9 : 4} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={bs * 1.4} strokeDashoffset={bs * 1.4 * (1 - clamp01(tickP))} />
            )}
          </g>
        );
      })}
      <text x={l + w - (big ? 50 : 24)} y={t + h - (big ? 28 : 14)} textAnchor="end" fontFamily={FONT.mono} fontSize={big ? 20 : 12} fill={C.ink} opacity={0.6} letterSpacing="0.12em">
        INSPECTOR: ████████
      </text>
    </g>
  );
};

export const fmtNumber = (n: number) => Math.round(n).toLocaleString("en-US");

export const CounterNumber: React.FC<{ x: number; y: number; value: number; size: number; suffix?: string; label?: string; color?: string; labelColor?: string }> = ({ x, y, value, size, suffix = "", label, color = C.fg, labelColor = C.dim }) => (
  <g>
    <text x={x} y={y} textAnchor="middle" style={{ ...DISPLAY_STYLE, fontVariantNumeric: "tabular-nums" }} fontSize={size} fill={color} filter={color === C.red ? "url(#glowRed)" : "url(#glow)"}>
      {fmtNumber(value)}
      {suffix && <tspan fontSize={size * 0.5}>{suffix}</tspan>}
    </text>
    {label && (
      <text x={x} y={y + size * 0.32 + 18} textAnchor="middle" fontFamily={FONT.mono} fontWeight={500} fontSize={Math.max(22, size * 0.13)} letterSpacing="0.22em" fill={labelColor}>
        {label}
      </text>
    )}
  </g>
);

// High-angle (≈35° from above) living room, seen from the corner.
export const RoomIso: React.FC<{ x: number; y: number; w: number; t: number; fps: number }> = ({ x, y, w, t, fps }) => {
  const d = w * 0.3;
  const fl = { tl: { x: x - w * 0.42, y: y - d * 0.55 }, tr: { x: x + w * 0.42, y: y - d * 0.55 }, br: { x: x + w * 0.56, y: y + d * 0.8 }, bl: { x: x - w * 0.56, y: y + d * 0.8 } };
  const wallH = 190;
  return (
    <g>
      <path d={`M${fl.tl.x} ${fl.tl.y} L ${fl.tl.x} ${fl.tl.y - wallH} L ${fl.tr.x} ${fl.tr.y - wallH} L ${fl.tr.x} ${fl.tr.y} Z`} fill="#101318" stroke={C.line} strokeWidth={3} />
      <path d={`M${fl.tl.x} ${fl.tl.y} L ${fl.tr.x} ${fl.tr.y} L ${fl.br.x} ${fl.br.y} L ${fl.bl.x} ${fl.bl.y} Z`} fill="#0E1115" stroke={C.line} strokeWidth={3} />
      {Array.from({ length: 7 }, (_, i) => {
        const f = (i + 1) / 8;
        return <path key={i} d={`M${lerp(fl.tl.x, fl.bl.x, f)} ${lerp(fl.tl.y, fl.bl.y, f)} L ${lerp(fl.tr.x, fl.br.x, f)} ${lerp(fl.tr.y, fl.br.y, f)}`} stroke={C.line} strokeWidth={1} opacity={0.35} />;
      })}
      {/* window on the back wall */}
      <rect x={x - 120} y={fl.tl.y - wallH + 50} width={240} height={140} fill="#0E141C" stroke={C.line} strokeWidth={3} />
      <path d={`M${x} ${fl.tl.y - wallH + 50} v 140 M${x - 120} ${fl.tl.y - wallH + 120} h 240`} stroke={C.line} strokeWidth={3} />
      <g transform={`translate(${x - w * 0.36} ${fl.tl.y + 6}) scale(0.62)`}>
        <Bookcase x={0} y={0} h={380} />
      </g>
      <g transform={`translate(${x + w * 0.33} ${fl.tl.y + 30}) scale(0.62)`}>
        <FloorLamp x={0} y={0} h={360} on={1} />
      </g>
      <g transform={`translate(${x - 40} ${y + 50}) scale(0.7)`}>
        <Sofa x={0} y={0} w={560} />
        <g transform={`translate(-60 ${-62}) scale(2.3)`} filter="url(#glow)">
          <PersonBody pose={POSES.read} />
        </g>
      </g>
      {/* the cat looks UP into the camera: front view, face tilted up */}
      <g transform={`translate(${x + w * 0.24} ${y + 150}) scale(1.75)`} filter="url(#glow)">
        <Cat pose="sit-front" eyeOpen={1} headDip={-0.35 + 0.02 * Math.sin((t / fps) * 1.3)} />
      </g>
      <path d={`M${x + w * 0.24} ${y + 150 - 128} l 0 -26 m -9 9 l 9 -9 l 9 9`} stroke={C.blue} strokeWidth={3} fill="none" opacity={0.7} strokeLinecap="round" />
    </g>
  );
};

export const randomBars = (seed: number, n: number) => Array.from({ length: n }, (_, i) => 0.35 + rand(seed + i * 3.7) * 0.6);
