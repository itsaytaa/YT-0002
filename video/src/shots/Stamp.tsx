// Rubber stamp: red outlined box with display text, rough ink texture (noise mask).
import React from "react";
import { C, DISPLAY_STYLE } from "../theme";

export const StampDefs: React.FC<{ id: string; seed?: number }> = ({ id, seed = 3 }) => (
  <filter id={id} x="-10%" y="-20%" width="120%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} result="n" />
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.2 2.45" result="speck" />
    <feComposite in="SourceGraphic" in2="speck" operator="in" result="inked" />
    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={2} seed={seed + 5} result="warp" />
    <feDisplacementMap in="inked" in2="warp" scale={5} xChannelSelector="R" yChannelSelector="G" />
  </filter>
);

export const Stamp: React.FC<{ x: number; y: number; text: string; size: number; rot: number; scale?: number; opacity?: number; color?: string; id: string; seed?: number; box?: boolean }> = ({ x, y, text, size, rot, scale = 1, opacity = 0.85, color = C.red, id, seed, box = true }) => {
  const w = text.length * size * 0.5 + size * 0.9;
  const h = size * 1.35;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} opacity={opacity}>
      <defs>
        <StampDefs id={id} seed={seed} />
      </defs>
      <g filter={`url(#${id})`}>
        {box && <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={size * 0.08} fill="none" stroke={color} strokeWidth={Math.max(4, size * 0.08)} />}
        {box && <rect x={-w / 2 + size * 0.14} y={-h / 2 + size * 0.14} width={w - size * 0.28} height={h - size * 0.28} rx={size * 0.05} fill="none" stroke={color} strokeWidth={Math.max(1.5, size * 0.025)} />}
        <text x={0} y={size * 0.36} textAnchor="middle" style={DISPLAY_STYLE} fontSize={size} fill={color} letterSpacing="0.04em">
          {text}
        </text>
      </g>
    </g>
  );
};
