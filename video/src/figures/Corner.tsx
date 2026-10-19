// Room corner: a vertical vertex line, two wall-top lines and two floor lines diverging
// at ±18°, with a darker gradient inside the wedge. Variants: plain, lit, washed, dark.
import React from "react";
import { C } from "../theme";

const T18 = Math.tan((18 * Math.PI) / 180);

export const cornerVertex = (x: number, y: number, h: number) => ({ x, y: y - 0.4 * h });

export const Corner: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  variant?: string;
  emphasis?: boolean;
  brighten?: number; // 0..1
  id: string;
}> = ({ x, y, w, h, variant = "plain", emphasis = false, brighten = 0, id }) => {
  const hw = w / 2;
  const top = y - h;
  const dy = T18 * hw;
  const stroke = emphasis ? 3.5 + 2 * brighten : 3;
  const color = emphasis ? (brighten > 0 ? mix(C.dim, C.fg, 0.55 + 0.45 * brighten) : "#AEB6C0") : variant === "dark" ? "#3A4048" : C.line;
  const wedge = `M${x - hw} ${top - dy} L ${x} ${top} L ${x + hw} ${top - dy} L ${x + hw} ${y + dy} L ${x} ${y} L ${x - hw} ${y + dy} Z`;
  const depth = variant === "dark" ? 0.75 : 0.45;
  return (
    <g>
      <defs>
        <radialGradient id={`cg${id}`} cx={x} cy={y - h * 0.45} r={Math.max(w, h) * 0.62} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" stopOpacity={depth} />
          <stop offset="0.55" stopColor="#000" stopOpacity={depth * 0.45} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`cw${id}`} x1={x - hw} x2={x + hw} y1={0} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity={0.012} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.035} />
          <stop offset="1" stopColor="#fff" stopOpacity={0.006} />
        </linearGradient>
        <radialGradient id={`cf${id}`} cx={x} cy={y - h * 0.5} r={Math.max(hw, h * 0.55)} gradientUnits="userSpaceOnUse">
          <stop offset="0.3" stopColor="#fff" />
          <stop offset="0.95" stopColor="#000" />
        </radialGradient>
        <radialGradient id={`cl${id}`} cx={x} cy={y - h * 0.5} r={Math.max(w, h) * 0.7} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF4E0" stopOpacity={variant === "washed" ? 0.95 : 0.22} />
          <stop offset={variant === "washed" ? 0.45 : 0.6} stopColor="#FFF4E0" stopOpacity={variant === "washed" ? 0.55 : 0.08} />
          <stop offset="1" stopColor="#FFF4E0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <mask id={`cm${id}`} maskUnits="userSpaceOnUse">
        <rect x={x - hw - 10} y={top - dy - 10} width={w + 20} height={h + 2 * dy + 20} fill={`url(#cf${id})`} />
      </mask>
      <g mask={`url(#cm${id})`}>
        <path d={wedge} fill={`url(#cw${id})`} />
        <path d={wedge} fill={`url(#cg${id})`} />
      </g>
      <g stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" filter={emphasis ? "url(#glowSoft)" : undefined} opacity={variant === "washed" ? 0.35 : 1}>
        <path d={`M${x} ${top} L ${x} ${y}`} />
        <path d={`M${x - hw} ${top - dy} L ${x} ${top} L ${x + hw} ${top - dy}`} />
        <path d={`M${x - hw} ${y + dy} L ${x} ${y} L ${x + hw} ${y + dy}`} />
      </g>
      {(variant === "lit" || variant === "washed") && <path d={wedge} fill={`url(#cl${id})`} style={{ mixBlendMode: "screen" }} mask={`url(#cm${id})`} />}
      {variant === "washed" && (
        <g>
          <ellipse cx={x} cy={y - h * 0.48} rx={w * 0.42} ry={h * 0.46} fill="#FFF6E8" opacity={0.32} filter="url(#bloomBig)" />
          <ellipse cx={x} cy={y - h * 0.46} rx={w * 0.2} ry={h * 0.24} fill="#FFFBF2" opacity={0.55} filter="url(#bloom)" />
        </g>
      )}
    </g>
  );
};

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}
