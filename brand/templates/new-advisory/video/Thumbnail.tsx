// YouTube thumbnail for Advisory {{ID}}, 1280x720 (brand/BRAND.md §7): near-black, one big
// pictogram moment, 2–4 words in the display face with a red rule, a small blue
// ADVISORY tag, stronger vignette. Replace the scene below with this advisory's moment.
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, DISPLAY_STYLE } from "../../theme";
import { Defs } from "../../figures/Defs";
import { Corner } from "../../figures/Corner";
import { PersonBody, POSES } from "../../figures/Person";
import { InspectorBody } from "../../figures/Inspector";
import { Grain, Vignette } from "../../overlays/Overlays";
import { loadFonts } from "../../fonts";

loadFonts();

const HOOK = "DO NOT TODO"; // 2–4 words

export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <svg width={1280} height={720} viewBox="0 0 1280 720">
      <Defs />
      <Corner id="thumb" x={985} y={640} w={560} h={600} variant="dark" />
      <g transform="translate(985 640) scale(5.2)" opacity={0.25}>
        <InspectorBody pose="corner" />
      </g>
      <g transform="translate(300 712) scale(3.7)" filter="url(#glow)">
        <PersonBody pose={POSES["stand-side"]} />
      </g>
      <text x={64} y={92} fontFamily={FONT.mono} fontWeight={600} fontSize={30} letterSpacing="0.28em" fill={C.blue}>
        ADVISORY {{ID}}
      </text>
      <text x={58} y={232} style={DISPLAY_STYLE} fontSize={150} fill={C.fg} letterSpacing="0.01em" filter="url(#glowSoft)">
        {HOOK}
      </text>
      <rect x={64} y={256} width={560} height={12} fill={C.red} filter="url(#glowRed)" />
    </svg>
    <Vignette strength={0.8} />
    <Grain frame={3} />
  </AbsoluteFill>
);
