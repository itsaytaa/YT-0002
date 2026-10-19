// Furniture and props. Outlines in line/dim colours on dark fills so the solid fg
// figures stay the focus. Coordinates follow scene-library.md (x = centre, y = ground).
import React from "react";
import { C, FONT } from "../theme";
import { rand } from "../anim";

const S = { stroke: C.line, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export const Bookcase: React.FC<{ x: number; y: number; h: number; opacity?: number }> = ({ x, y, h, opacity = 1 }) => {
  const w = h * 0.5;
  const l = x - w / 2, top = y - h;
  const shelves = 4;
  const gap = (h - 16) / (shelves + 1);
  const books: React.ReactNode[] = [];
  for (let s = 0; s <= shelves; s++) {
    const base = top + 8 + gap * (s + 1);
    let bx = l + 12;
    let k = 0;
    while (bx < l + w - 18 && k < 12) {
      const r = rand(s * 31 + k * 7.3);
      const bw = 9 + r * 12;
      const bh = gap * (0.52 + rand(s * 11 + k) * 0.36);
      if (rand(s * 5 + k * 3.1) > 0.82 && k > 0) {
        bx += 10;
        k++;
        continue;
      }
      const lean = rand(s + k * 13) > 0.9 && bx + bw + 20 < l + w ? -12 : 0;
      const col = [C.line, "#3A424C", C.dim, "#2E353E"][Math.floor(rand(s * 3 + k * 1.7) * 4)];
      books.push(
        <rect key={`${s}-${k}`} x={bx} y={base - bh} width={bw} height={bh} rx={1.5} fill={col} opacity={0.9} transform={lean ? `rotate(${lean} ${bx + bw} ${base})` : undefined} />,
      );
      bx += bw + 2 + (lean ? 8 : 0);
      k++;
    }
  }
  return (
    <g opacity={opacity}>
      <rect x={l} y={top} width={w} height={h} fill={C.surface} {...S} />
      {Array.from({ length: shelves }, (_, i) => (
        <path key={i} d={`M${l} ${top + 8 + gap * (i + 1)} H ${l + w}`} {...S} strokeWidth={2.5} />
      ))}
      {books}
      <rect x={l} y={top} width={w} height={h} fill="none" {...S} />
      <rect x={l + 6} y={y - 10} width={w - 12} height={10} fill={C.surface2} stroke={C.line} strokeWidth={2} />
    </g>
  );
};

// Sofa. Seat top is at y - 0.11w (for the default view); persons are snapped onto it.
export const sofaSeatY = (y: number, w: number, close?: boolean) => (close ? y - w * 0.2 : y - Math.min(w, 900) * 0.112);

export const Sofa: React.FC<{ x: number; y: number; w: number; close?: boolean; dent?: string; view?: string; opacity?: number }> = ({ x, y, w, close, dent, view, opacity = 1 }) => {
  if (view === "back") {
    // Foreground silhouette seen from behind.
    const h = w * 0.3;
    return (
      <g opacity={opacity}>
        <path d={`M${x - w / 2} ${y + 40} L ${x - w / 2} ${y - h + 34} Q ${x - w / 2} ${y - h} ${x - w / 2 + 40} ${y - h} L ${x + w / 2 - 40} ${y - h} Q ${x + w / 2} ${y - h} ${x + w / 2} ${y - h + 34} L ${x + w / 2} ${y + 40} Z`} fill="#07080A" stroke="#2A3038" strokeWidth={3} />
        <path d={`M${x - w / 2 + 24} ${y - h + 22} Q ${x} ${y - h + 12} ${x + w / 2 - 24} ${y - h + 22}`} stroke="#1E232A" strokeWidth={3} fill="none" />
      </g>
    );
  }
  const k = close ? w / 600 : Math.min(w, 900) / 900;
  const sw = close ? w : w;
  const l = x - sw / 2, r = x + sw / 2;
  const seat = close ? y - 120 * k : y - 100 * k;
  const back = close ? y - 330 * k : y - 255 * k;
  const arm = close ? y - 190 * k : y - 165 * k;
  const armW = close ? 70 * k : 70 * k;
  const legH = 14 * k;
  const cushions = close ? 2 : 2;
  const cw = (sw - armW * 2) / cushions;
  return (
    <g opacity={opacity}>
      <rect x={l + armW * 0.6} y={back} width={sw - armW * 1.2} height={seat - back + 10} rx={26 * k} fill={C.surface} {...S} />
      {Array.from({ length: cushions }, (_, i) => {
        const cx = l + armW + cw * i;
        const isDent = dent === "left-seat" && i === 0;
        const d = isDent
          ? `M${cx + 6} ${seat + 4} Q ${cx + 6} ${seat - 22 * k} ${cx + 30} ${seat - 24 * k} Q ${cx + cw / 2} ${seat - 6 * k} ${cx + cw - 30} ${seat - 24 * k} Q ${cx + cw - 6} ${seat - 22 * k} ${cx + cw - 6} ${seat + 4} Z`
          : `M${cx + 6} ${seat + 4} Q ${cx + 6} ${seat - 24 * k} ${cx + 30} ${seat - 26 * k} L ${cx + cw - 30} ${seat - 26 * k} Q ${cx + cw - 6} ${seat - 24 * k} ${cx + cw - 6} ${seat + 4} Z`;
        return (
          <g key={i}>
            <rect x={cx + 6} y={back + 18 * k} width={cw - 12} height={seat - back - 40 * k} rx={18 * k} fill={C.surface2} stroke={C.line} strokeWidth={2.5} />
            <path d={d} fill={C.surface2} stroke={C.line} strokeWidth={2.5} />
            {isDent && <path d={`M${cx + 40} ${seat - 14 * k} Q ${cx + cw / 2} ${seat + 2 * k} ${cx + cw - 40} ${seat - 14 * k}`} stroke={C.dim} strokeWidth={2} fill="none" opacity={0.8} />}
          </g>
        );
      })}
      <rect x={l + 10} y={seat} width={sw - 20} height={y - legH - seat} rx={10 * k} fill={C.surface} {...S} />
      <rect x={l} y={arm} width={armW} height={y - legH - arm} rx={22 * k} fill={C.surface2} {...S} />
      <rect x={r - armW} y={arm} width={armW} height={y - legH - arm} rx={22 * k} fill={C.surface2} {...S} />
      <path d={`M${l + 30} ${y - legH} v ${legH} M${r - 30} ${y - legH} v ${legH}`} {...S} strokeWidth={5} />
    </g>
  );
};

export const armchairSeatY = (y: number, w: number) => y - w * 0.3;

export const Armchair: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => {
  const k = w / 320;
  const l = x - w / 2, r = x + w / 2;
  const seat = y - 96 * k, back = y - 300 * k, arm = y - 160 * k, armW = 58 * k;
  return (
    <g>
      <rect x={l + armW * 0.4} y={back} width={w - armW * 0.8} height={seat - back + 10} rx={30 * k} fill={C.surface} {...S} />
      <path d={`M${l + armW} ${seat + 4} Q ${l + armW} ${seat - 22 * k} ${l + armW + 24} ${seat - 24 * k} L ${r - armW - 24} ${seat - 24 * k} Q ${r - armW} ${seat - 22 * k} ${r - armW} ${seat + 4} Z`} fill={C.surface2} stroke={C.line} strokeWidth={2.5} />
      <rect x={l + 8} y={seat} width={w - 16} height={y - 14 * k - seat} rx={10} fill={C.surface} {...S} />
      <rect x={l} y={arm} width={armW} height={y - 14 * k - arm} rx={20 * k} fill={C.surface2} {...S} />
      <rect x={r - armW} y={arm} width={armW} height={y - 14 * k - arm} rx={20 * k} fill={C.surface2} {...S} />
      <path d={`M${l + 24} ${y - 14 * k} v ${14 * k} M${r - 24} ${y - 14 * k} v ${14 * k}`} {...S} strokeWidth={5} />
    </g>
  );
};

export const Bed: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => {
  const l = x - w / 2, r = x + w / 2;
  const top = y - w * 0.22;
  return (
    <g>
      <rect x={l} y={y - w * 0.5} width={w * 0.07} height={w * 0.5} rx={10} fill={C.surface2} {...S} />
      <rect x={l + w * 0.03} y={top} width={w * 0.97} height={w * 0.12} rx={14} fill={C.surface} {...S} />
      <rect x={l + w * 0.09} y={top - w * 0.07} width={w * 0.2} height={w * 0.08} rx={18} fill={C.surface2} stroke={C.line} strokeWidth={2.5} />
      <rect x={l + w * 0.03} y={top + w * 0.12} width={w * 0.97} height={w * 0.05} fill={C.surface2} {...S} />
      <path d={`M${l + w * 0.06} ${y - w * 0.05} v ${w * 0.05} M${r - 20} ${y - w * 0.05} v ${w * 0.05}`} {...S} strokeWidth={5} />
    </g>
  );
};

export const FloorLamp: React.FC<{ x: number; y: number; h: number; on: number }> = ({ x, y, h, on }) => {
  const top = y - h;
  const shadeW = h * 0.26;
  return (
    <g>
      {on > 0 && (
        <g opacity={on}>
          <defs>
            <linearGradient id={`cone${x}`} x1={0} y1={top + 40} x2={0} y2={y + 40} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FFF6E6" stopOpacity={0.4} />
              <stop offset="1" stopColor="#FFF6E6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={`M${x - shadeW * 0.5} ${top + h * 0.13} L ${x - h * 0.55} ${y + 30} L ${x + h * 0.55} ${y + 30} L ${x + shadeW * 0.5} ${top + h * 0.13} Z`} fill={`url(#cone${x})`} />
          <ellipse cx={x} cy={top + h * 0.06} rx={shadeW * 0.9} ry={shadeW * 0.6} fill="#FFF6E6" opacity={0.35} filter="url(#bloom)" />
        </g>
      )}
      <path d={`M${x} ${top + h * 0.12} L ${x} ${y - 6}`} {...S} strokeWidth={5} />
      <ellipse cx={x} cy={y - 4} rx={h * 0.09} ry={7} fill={C.surface2} {...S} />
      <path d={`M${x - shadeW * 0.32} ${top} L ${x + shadeW * 0.32} ${top} L ${x + shadeW * 0.5} ${top + h * 0.13} L ${x - shadeW * 0.5} ${top + h * 0.13} Z`} fill={on > 0 ? "#F4EEE2" : C.surface2} {...S} />
    </g>
  );
};

export const Window: React.FC<{ x: number; y: number; w?: number; sky: string; mix?: number; moonPos?: number }> = ({ x, y, w = 300, sky, mix = 0, moonPos = 0 }) => {
  const h = w * 0.86;
  const l = x - w / 2, t = y - h / 2;
  const night = "#0E141C", day = "#3B5568";
  const isDay = sky === "day" || sky === "sun" || (sky === "moon-to-sun" && mix > 0.5);
  const dayAmt = sky === "day" || sky === "sun" ? 1 : sky === "moon-to-sun" ? mix : 0;
  const id = `win${Math.round(x)}${Math.round(y)}`;
  const moonXs = [0.7, 0.42, 0.22];
  const mx = l + w * (sky === "moon" && moonPos ? moonXs[moonPos % 3] : 0.7);
  const my = t + h * (moonPos ? [0.3, 0.22, 0.34][moonPos % 3] : 0.3);
  return (
    <g>
      <clipPath id={id}>
        <rect x={l} y={t} width={w} height={h} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect x={l} y={t} width={w} height={h} fill={night} />
        <rect x={l} y={t} width={w} height={h} fill={day} opacity={dayAmt} />
        {(sky === "moon" || sky === "moon-to-sun") && (
          <g opacity={1 - dayAmt}>
            <circle cx={mx} cy={my} r={w * 0.08} fill={C.blue} filter="url(#glowBlue)" />
            <circle cx={mx + w * 0.035} cy={my - w * 0.02} r={w * 0.07} fill={night} />
            {[0.2, 0.33, 0.55, 0.85].map((f, i) => (
              <circle key={i} cx={l + w * f} cy={t + h * [0.6, 0.18, 0.75, 0.62][i]} r={1.6} fill={C.dim} />
            ))}
          </g>
        )}
        {(sky === "sun" || sky === "moon-to-sun") && <circle cx={l + w * 0.32} cy={t + h * (0.7 - 0.4 * dayAmt)} r={w * 0.07} fill="#F4EEE2" opacity={dayAmt} filter="url(#glow)" />}
        {isDay && <path d={`M${l} ${t + h * 0.82} Q ${x} ${t + h * 0.74} ${l + w} ${t + h * 0.8} L ${l + w} ${t + h} L ${l} ${t + h} Z`} fill="#2C3E4C" opacity={dayAmt} />}
      </g>
      <rect x={l} y={t} width={w} height={h} fill="none" {...S} strokeWidth={4} />
      <path d={`M${x} ${t} V ${t + h} M${l} ${y} H ${l + w}`} {...S} strokeWidth={4} />
      <rect x={l - 14} y={t + h} width={w + 28} height={12} rx={3} fill={C.surface2} {...S} />
    </g>
  );
};

export const Clock: React.FC<{ x: number; y: number; r: number; minutes: number; seconds: number }> = ({ x, y, r, minutes, seconds }) => {
  const hourA = ((minutes / 60) % 12) * 30;
  const minA = (minutes % 60) * 6;
  const secA = (seconds % 60) * 6;
  const hand = (a: number, len: number, wdt: number, col: string, back = 0) => {
    const rd = ((a - 90) * Math.PI) / 180;
    return <path d={`M${x - Math.cos(rd) * back} ${y - Math.sin(rd) * back} L ${x + Math.cos(rd) * len} ${y + Math.sin(rd) * len}`} stroke={col} strokeWidth={wdt} strokeLinecap="round" />;
  };
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={C.surface} stroke={C.dim} strokeWidth={Math.max(3, r * 0.035)} />
      <circle cx={x} cy={y} r={r * 0.93} fill="none" stroke={C.line} strokeWidth={1.5} />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i * 6 * Math.PI) / 180;
        const big = i % 5 === 0;
        const r1 = r * (big ? 0.76 : 0.84), r2 = r * 0.88;
        return <path key={i} d={`M${x + Math.sin(a) * r1} ${y - Math.cos(a) * r1} L ${x + Math.sin(a) * r2} ${y - Math.cos(a) * r2}`} stroke={big ? C.fg : C.line} strokeWidth={big ? Math.max(2.5, r * 0.035) : 1.4} strokeLinecap="round" />;
      })}
      {hand(hourA, r * 0.48, Math.max(4, r * 0.06), C.fg, r * 0.08)}
      {hand(minA, r * 0.7, Math.max(3, r * 0.04), C.fg, r * 0.1)}
      {hand(secA, r * 0.78, Math.max(1.5, r * 0.015), C.red, r * 0.16)}
      <circle cx={x} cy={y} r={Math.max(4, r * 0.05)} fill={C.red} />
    </g>
  );
};

export const CatBed: React.FC<{ x: number; y: number; w: number; tag?: string; sway?: number }> = ({ x, y, w, tag, sway = 0 }) => {
  const h = w * 0.3;
  return (
    <g>
      <ellipse cx={x} cy={y - h * 0.42} rx={w * 0.5} ry={h * 0.5} fill={C.surface2} {...S} />
      <ellipse cx={x} cy={y - h * 0.56} rx={w * 0.38} ry={h * 0.26} fill="#0F1216" stroke={C.line} strokeWidth={2} />
      <path d={`M${x - w * 0.5} ${y - h * 0.42} Q ${x - w * 0.48} ${y} ${x - w * 0.3} ${y} L ${x + w * 0.3} ${y} Q ${x + w * 0.48} ${y} ${x + w * 0.5} ${y - h * 0.42}`} fill={C.surface} {...S} />
      {tag && <PriceTag x={x + w * 0.4} y={y - h * 0.3} text={tag} sway={sway} />}
    </g>
  );
};

export const CatBedFront: React.FC<{ x: number; y: number; w: number; tag?: string; sway?: number }> = ({ x, y, w, tag, sway = 0 }) => {
  const h = w * 0.3;
  return (
    <g>
      <path d={`M${x - w * 0.5} ${y - h * 0.42} Q ${x - w * 0.48} ${y} ${x - w * 0.3} ${y} L ${x + w * 0.3} ${y} Q ${x + w * 0.48} ${y} ${x + w * 0.5} ${y - h * 0.42} Q ${x} ${y - h * 0.08} ${x - w * 0.5} ${y - h * 0.42} Z`} fill={C.surface} {...S} />
      {tag && <PriceTag x={x + w * 0.4} y={y - h * 0.3} text={tag} sway={sway} />}
    </g>
  );
};

const PriceTag: React.FC<{ x: number; y: number; text: string; sway: number }> = ({ x, y, text, sway }) => (
  <g transform={`rotate(${sway} ${x} ${y})`}>
    <path d={`M${x} ${y} L ${x + 6} ${y + 36}`} stroke={C.dim} strokeWidth={1.5} />
    <g transform={`translate(${x + 6} ${y + 36}) rotate(-8)`}>
      <path d="M-48 0 L 40 0 L 54 17 L 40 34 L -48 34 Z" fill={C.surface2} stroke={C.dim} strokeWidth={2} />
      <circle cx={42} cy={17} r={3.2} fill={C.bg} stroke={C.dim} strokeWidth={1.2} />
      <text x={-4} y={25} textAnchor="middle" fontFamily={FONT.mono} fontWeight={600} fontSize={24} fill={C.fg} letterSpacing="0.04em">
        {text}
      </text>
    </g>
  </g>
);

export const BoxBack: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => {
  const h = w * 0.55;
  return (
    <g>
      <path d={`M${x - w / 2 + 14} ${y - h} L ${x - w / 2 + 34} ${y - h - 22} L ${x + w / 2 - 34} ${y - h - 22} L ${x + w / 2 - 14} ${y - h} Z`} fill="#0F1216" stroke={C.line} strokeWidth={2.5} strokeLinejoin="round" />
      <path d={`M${x - w / 2 + 34} ${y - h - 22} L ${x - w / 2 + 50} ${y - h - 70} L ${x + w / 2 - 60} ${y - h - 64} L ${x + w / 2 - 34} ${y - h - 22}`} fill={C.surface} stroke={C.line} strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  );
};

export const BoxFront: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => {
  const h = w * 0.55;
  return (
    <g>
      <rect x={x - w / 2} y={y - h} width={w} height={h} fill="#1A1E24" {...S} />
      <path d={`M${x - w / 2} ${y - h} L ${x - w / 2 - 44} ${y - h - 40} L ${x - w / 2 - 30} ${y - h - 46} L ${x - w / 2 + 12} ${y - h}`} fill={C.surface} {...S} />
      <path d={`M${x + w / 2} ${y - h} L ${x + w / 2 + 44} ${y - h - 36} L ${x + w / 2 + 32} ${y - h - 44} L ${x + w / 2 - 12} ${y - h}`} fill={C.surface} {...S} />
      <path d={`M${x - w * 0.2} ${y - h * 0.62} H ${x + w * 0.2}`} stroke={C.line} strokeWidth={2} strokeDasharray="10 8" />
      <path d={`M${x - w * 0.36} ${y - h * 0.25} l 18 0 m -9 -9 l 0 18`} stroke={C.line} strokeWidth={2} opacity={0.7} />
    </g>
  );
};

export const BookCloseUp: React.FC<{ x: number; y: number; w: number; turn: number }> = ({ x, y, w, turn }) => {
  const h = w * 0.62;
  const pageW = w * 0.47;
  const linesL = Array.from({ length: 9 }, (_, i) => i);
  const textLines = (px: number, dir: number, seed: number) =>
    linesL.map((i) => {
      const len = pageW * (0.62 + rand(seed + i) * 0.22) * (i === 8 ? 0.5 : 1);
      return <rect key={i} x={dir > 0 ? px + 34 : px - 34 - len} y={y - h * 0.36 + i * h * 0.075} width={len} height={5} rx={2} fill={C.line} opacity={0.75} />;
    });
  const flip = turn > 0 && turn < 1;
  const fx = Math.cos(turn * Math.PI);
  return (
    <g>
      <path d={`M${x} ${y - h * 0.48} C ${x - pageW * 0.4} ${y - h * 0.56}, ${x - pageW * 0.8} ${y - h * 0.52}, ${x - pageW} ${y - h * 0.5} L ${x - pageW} ${y + h * 0.42} C ${x - pageW * 0.8} ${y + h * 0.44}, ${x - pageW * 0.4} ${y + h * 0.46}, ${x} ${y + h * 0.5} Z`} fill={C.surface2} stroke={C.dim} strokeWidth={2.5} />
      <path d={`M${x} ${y - h * 0.48} C ${x + pageW * 0.4} ${y - h * 0.56}, ${x + pageW * 0.8} ${y - h * 0.52}, ${x + pageW} ${y - h * 0.5} L ${x + pageW} ${y + h * 0.42} C ${x + pageW * 0.8} ${y + h * 0.44}, ${x + pageW * 0.4} ${y + h * 0.46}, ${x} ${y + h * 0.5} Z`} fill={C.surface2} stroke={C.dim} strokeWidth={2.5} />
      {textLines(x - pageW, 1, 3)}
      {textLines(x, 1, 17)}
      <path d={`M${x} ${y - h * 0.48} L ${x} ${y + h * 0.5}`} stroke={C.dim} strokeWidth={2} />
      {flip && (
        <path d={`M${x} ${y - h * 0.48} L ${x + pageW * fx} ${y - h * 0.5 - Math.sin(turn * Math.PI) * 30} L ${x + pageW * fx} ${y + h * 0.42 - Math.sin(turn * Math.PI) * 20} L ${x} ${y + h * 0.5} Z`} fill="#232A33" stroke={C.dim} strokeWidth={2.5} />
      )}
      {/* hands */}
      <g fill={C.fg} filter="url(#glow)">
        <rect x={x - pageW - 46} y={y - 10} width={74} height={120} rx={30} transform={`rotate(-14 ${x - pageW} ${y + 40})`} />
        <rect x={x + pageW - 28} y={y - 10} width={74} height={120} rx={30} transform={`rotate(14 ${x + pageW} ${y + 40})`} />
        <rect x={x - pageW - 6} y={y + 8} width={34} height={60} rx={16} transform={`rotate(-30 ${x - pageW} ${y + 30})`} />
        <rect x={x + pageW - 28} y={y + 8} width={34} height={60} rx={16} transform={`rotate(30 ${x + pageW} ${y + 30})`} />
      </g>
    </g>
  );
};

export const Bird: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`} fill={C.fg} filter="url(#glow)">
    <ellipse cx={0} cy={-12} rx={16} ry={10} />
    <circle cx={13} cy={-22} r={7.5} />
    <path d="M20 -23 L 28 -21 L 20 -19 Z" />
    <path d="M-12 -14 L -30 -20 L -26 -10 Z" />
    <path d="M-2 -16 Q 4 -26 10 -14 Z" fill={C.line} />
    <path d="M0 -3 L -1 2 M5 -3 L 6 2" stroke={C.fg} strokeWidth={2} strokeLinecap="round" />
  </g>
);

export const Door: React.FC<{ x: number; y: number; h: number }> = ({ x, y, h }) => {
  const w = h * 0.45;
  return (
    <g>
      <rect x={x - w / 2 - 14} y={y - h - 14} width={w + 28} height={h + 14} fill="none" {...S} strokeWidth={4} />
      <rect x={x - w / 2} y={y - h} width={w} height={h} fill={C.surface} {...S} />
      <rect x={x - w / 2 + 26} y={y - h + 30} width={w - 52} height={h * 0.36} rx={4} fill="none" stroke={C.line} strokeWidth={2.5} />
      <rect x={x - w / 2 + 26} y={y - h * 0.52} width={w - 52} height={h * 0.4} rx={4} fill="none" stroke={C.line} strokeWidth={2.5} />
      <circle cx={x + w / 2 - 26} cy={y - h * 0.5} r={7} fill={C.dim} />
      <rect x={x - 22} y={y - h * 0.72} width={44} height={8} rx={2} fill={C.line} />
    </g>
  );
};

export const Mat: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => (
  <g>
    <path d={`M${x - w / 2 + 20} ${y - 14} L ${x + w / 2 - 20} ${y - 14} L ${x + w / 2} ${y + 12} L ${x - w / 2} ${y + 12} Z`} fill={C.surface2} stroke={C.line} strokeWidth={2.5} strokeLinejoin="round" />
    <path d={`M${x - w / 2 + 34} ${y - 6} L ${x + w / 2 - 34} ${y - 6} L ${x + w / 2 - 22} ${y + 5} L ${x - w / 2 + 22} ${y + 5} Z`} fill="none" stroke={C.line} strokeWidth={1.5} opacity={0.7} />
  </g>
);

export const DocMini: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => {
  const h = w * 1.29;
  return (
    <g transform={`rotate(-3 ${x} ${y})`}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill={C.paper} stroke="#BDB6A6" strokeWidth={1.5} />
      <rect x={x - w / 2 + 26} y={y - h / 2 + 28} width={w * 0.55} height={9} fill={C.ink} />
      <rect x={x - w / 2 + 26} y={y - h / 2 + 46} width={w * 0.35} height={6} fill={C.ink} opacity={0.7} />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={x - w / 2 + 26} y={y - h / 2 + 84 + i * 30} width={(w - 52) * (0.5 + rand(i * 9) * 0.5)} height={i % 3 === 1 ? 12 : 5} fill={i % 3 === 1 ? C.redaction : C.ink} opacity={i % 3 === 1 ? 1 : 0.55} />
      ))}
      <rect x={x + w / 2 - 110} y={y + h / 2 - 70} width={80} height={36} fill="none" stroke={C.red} strokeWidth={3} opacity={0.8} transform={`rotate(-8 ${x + w / 2 - 70} ${y + h / 2 - 52})`} />
    </g>
  );
};
