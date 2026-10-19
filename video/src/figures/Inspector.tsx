// The Department's inspector: person geometry with a wide-brim hat, a long coat and a
// clipboard. Grey, faceless. Units: body height 100 (the hat rises above it).
import React from "react";
import { C } from "../theme";

const DARK = "#5E6670";
const PAPER = "#C4CAD2";

const Hat: React.FC<{ cx: number; top: number; s?: number; color: string }> = ({ cx, top, s = 1, color }) => (
  <g transform={`translate(${cx} ${top}) scale(${s})`}>
    {/* crown */}
    <path d="M-9.5 0 L -8.2 -13 Q 0 -15.5 8.2 -13 L 9.5 0 Z" fill={color} />
    <path d="M-3 -14.2 Q 0 -12.6 3 -14.2" stroke={DARK} strokeWidth={0.9} fill="none" opacity={0.7} />
    {/* band */}
    <rect x={-9.6} y={-3.4} width={19.2} height={2.6} fill={DARK} opacity={0.75} />
    {/* brim */}
    <path d="M-16 0.6 Q 0 -2.2 16 0.6 Q 16.5 2.4 15 2.6 Q 0 0.8 -15 2.6 Q -16.5 2.4 -16 0.6 Z" fill={color} />
  </g>
);

const Clipboard: React.FC<{ x: number; y: number; rot?: number }> = ({ x, y, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-7.5} y={-9.5} width={15} height={19} rx={1.2} fill={DARK} />
    <rect x={-6} y={-7.5} width={12} height={16} fill={PAPER} />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={-4.5} y={-4.5 + i * 3.4} width={i === 3 ? 5 : 9} height={0.9} fill={DARK} opacity={0.6} />
    ))}
    <rect x={-3} y={-10.8} width={6} height={3} rx={0.8} fill={DARK} />
  </g>
);

export const InspectorBody: React.FC<{ pose: string; color?: string }> = ({ pose, color = C.grey }) => {
  if (pose === "bust") {
    return (
      <g>
        <path d="M-46 0 L -46 -8 Q -44 -24 -24 -27 L -10 -30 L 10 -30 L 24 -27 Q 44 -24 46 -8 L 46 0 Z" fill={color} />
        <path d="M-10 -30 L 0 -12 L 10 -30" stroke={DARK} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
        <path d="M-10 -30 L -16 -14 M10 -30 L 16 -14" stroke={DARK} strokeWidth={1.2} fill="none" opacity={0.8} />
        <rect x={-6} y={-38} width={12} height={10} fill={color} />
        <rect x={-17} y={-70} width={34} height={34} rx={10} fill={color} />
        <Hat cx={0} top={-63} s={1.7} color={color} />
      </g>
    );
  }
  const lean = pose === "lean-over";
  const turn = pose === "corner" ? 1 : 0;
  const upper = (
    <g>
      {/* coat */}
      <path
        d={`M${-13 + turn} -77 Q -15 -77 -15.5 -72 L ${-18 + turn} -27 L ${18 + turn * 1.5} -27 L 15.5 -72 Q 15 -77 ${13 + turn} -77 Z`}
        fill={color}
      />
      <path d="M-5 -77 L 0 -66 L 5 -77" stroke={DARK} strokeWidth={1.1} fill="none" strokeLinejoin="round" />
      <path d={`M${0.5 + turn} -66 L ${1 + turn} -28`} stroke={DARK} strokeWidth={0.8} opacity={0.6} />
      <rect x={-4} y={-82} width={8} height={7} fill={color} />
      {/* sleeves to the clipboard */}
      <path d="M-13.5 -74 L -17 -58 L -7 -55" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M13.5 -74 L 17 -58 L 7 -55" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M-17 -60 L -15.5 -57 M17 -60 L 15.5 -57" stroke={DARK} strokeWidth={0.8} opacity={0.5} />
      <Clipboard x={0} y={-58} rot={turn * 3} />
      <rect x={-10 + turn} y={-100} width={20} height={20} rx={6} fill={color} />
      <Hat cx={turn} top={-96.5} color={color} />
    </g>
  );
  if (lean) {
    // Bending over a sofa back: upper body pivots at the waist toward the right.
    return (
      <g>
        <g transform="rotate(32 0 -40)">{upper}</g>
      </g>
    );
  }
  return (
    <g>
      <path d="M-5.5 -30 L -5.5 -3.5" stroke={color} strokeWidth={7} strokeLinecap="round" />
      <path d={`M${5.5 + turn} -30 L ${5.5 + turn} -3.5`} stroke={color} strokeWidth={7} strokeLinecap="round" />
      {upper}
    </g>
  );
};
