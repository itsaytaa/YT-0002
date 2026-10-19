// YouTube thumbnail (style.json -> thumbnail), 1280x720.
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, DISPLAY_STYLE } from "../../theme";
import { Defs } from "../../figures/Defs";
import { Cat } from "../../figures/Cat";
import { Corner } from "../../figures/Corner";
import { InspectorBody } from "../../figures/Inspector";
import { Grain, Vignette } from "../../overlays/Overlays";
import { loadFonts } from "../../fonts";

loadFonts();

export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <svg width={1280} height={720} viewBox="0 0 1280 720">
      <Defs />
      <defs>
        <radialGradient id="thumbGlow" cx={980} cy={420} r={420} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.blue} stopOpacity={0.12} />
          <stop offset="1" stopColor={C.blue} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1280} height={720} fill="url(#thumbGlow)" />
      <Corner id="thumb" x={985} y={640} w={560} h={600} variant="dark" />
      <g transform="translate(985 640) scale(5.2)" opacity={0.25}>
        <InspectorBody pose="corner" />
      </g>
      {/* gaze from the cat into the corner */}
      <g fill={C.dim} opacity={0.8}>
        {Array.from({ length: 14 }, (_, i) => (
          <circle key={i} cx={420 + i * 30} cy={330 + i * 4.2} r={3.5} />
        ))}
      </g>
      <g transform="translate(300 805) scale(5.0)" filter="url(#glow)">
        <Cat pose="sit-back" />
      </g>
      <text x={64} y={92} fontFamily={FONT.mono} fontWeight={600} fontSize={30} letterSpacing="0.28em" fill={C.blue}>
        ADVISORY 0001
      </text>
      <text x={58} y={232} style={DISPLAY_STYLE} fontSize={150} fill={C.fg} letterSpacing="0.01em" filter="url(#glowSoft)">
        DO NOT LOOK
      </text>
      <rect x={64} y={256} width={560} height={12} fill={C.red} filter="url(#glowRed)" />
    </svg>
    <Vignette strength={0.8} />
    <Grain frame={3} />
  </AbsoluteFill>
);
