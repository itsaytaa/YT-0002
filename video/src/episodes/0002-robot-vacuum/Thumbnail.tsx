// YouTube thumbnail for Advisory 0002, 1280x720 (brand/BRAND.md §7): near-black, one big
// pictogram moment, the hook in the display face with a red rule, a small blue ADVISORY
// tag, stronger vignette than the video. Floor-level view: the vacuum in the lower left
// with its laser fan, dusty footprints running right to a closed door, the inspector a
// faint shape in front of it.
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, DISPLAY_STYLE } from "../../theme";
import { Defs } from "../../figures/Defs";
import { Door } from "../../figures/Props";
import { InspectorBody } from "../../figures/Inspector";
import { Grain, Vignette } from "../../overlays/Overlays";
import { loadFonts } from "../../fonts";
import { RobotVacuum, DustTrail } from "./vacuum";

loadFonts();

const HOOK = "LIGHTS OFF";
const FLOOR = 640;

export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <svg width={1280} height={720} viewBox="0 0 1280 720">
      <Defs />
      <defs>
        <radialGradient id="thumbGlow" cx={380} cy={FLOOR - 40} r={520} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.blue} stopOpacity={0.12} />
          <stop offset="1" stopColor={C.blue} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="thumbFloor" x1={0} y1={FLOOR} x2={0} y2={720} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.surface2} stopOpacity={0.9} />
          <stop offset="1" stopColor={C.bg} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect width={1280} height={720} fill="url(#thumbGlow)" />
      <rect x={0} y={FLOOR} width={1280} height={720 - FLOOR} fill="url(#thumbFloor)" />
      <path d={`M0 ${FLOOR} H 1280`} stroke={C.line} strokeWidth={2} opacity={0.6} />
      <Door x={1090} y={FLOOR} h={470} />
      <g transform={`translate(1090 ${FLOOR}) scale(3.75)`} opacity={0.25}>
        <InspectorBody pose="stand" />
      </g>
      <DustTrail e={{ el: "dust-trail", fromX: 640, toX: 1040, y: FLOOR + 4, scale: 1.35 }} t={0} dur={30} fps={30} />
      <RobotVacuum e={{ el: "robot-vacuum", x: 300, y: FLOOR, w: 560, facing: "right", light: "blue", beam: true }} t={33} dur={60} fps={30} />
      <text x={64} y={92} fontFamily={FONT.mono} fontWeight={600} fontSize={30} letterSpacing="0.28em" fill={C.blue}>
        ADVISORY 0002
      </text>
      <text x={58} y={232} style={DISPLAY_STYLE} fontSize={150} fill={C.fg} letterSpacing="0.01em" filter="url(#glowSoft)">
        {HOOK}
      </text>
      <rect x={64} y={256} width={520} height={12} fill={C.red} filter="url(#glowRed)" />
    </svg>
    <Vignette strength={0.95} />
    <Grain frame={3} />
  </AbsoluteFill>
);
