// Development sheet for the figure primitives (not part of the video).
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, GLOW } from "./theme";
import { Defs } from "./figures/Defs";
import { PersonBody, POSES } from "./figures/Person";
import { Cat, CatFace } from "./figures/Cat";
import { InspectorBody } from "./figures/Inspector";
import { Corner } from "./figures/Corner";
import { loadFonts } from "./fonts";

loadFonts();

export const Lab: React.FC = () => {
  const poses = ["stand-front", "stand-side", "stand-down-right", "kneel", "push", "shrug", "sit-chair", "read", "sit-floor-back", "sit-floor-back-down", "sit-floor-side"];
  const cats = ["sit-side", "sit-back", "sit-front", "loaf", "walk", "sleep"];
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <svg width={1920} height={1080}>
        <Defs />
        {poses.map((p, i) => (
          <g key={p} transform={`translate(${110 + i * 165} 330) scale(2.4)`} filter="url(#glow)">
            <PersonBody pose={POSES[p]} />
          </g>
        ))}
        {cats.map((p, i) => (
          <g key={p} transform={`translate(${150 + i * 230} 640) scale(1.9)`} filter="url(#glow)">
            <Cat pose={p} eyes={p === "sit-side" ? "squint" : undefined} eyeOpen={p === "sit-side" ? 0.3 : 1} />
          </g>
        ))}
        <g transform="translate(1560 640) scale(2.2)">
          <CatFace yaw={0} pupil={0.3} />
        </g>
        <g transform="translate(1800 640) scale(1.4)">
          <CatFace yaw={60} pupil={0.6} />
        </g>
        <Corner id="a" x={300} y={1040} w={300} h={300} />
        {["stand", "corner", "lean-over"].map((p, i) => (
          <g key={p} transform={`translate(${620 + i * 200} 1040) scale(2.6)`}>
            <InspectorBody pose={p} />
          </g>
        ))}
        <g transform="translate(1300 1040) scale(2.6)">
          <InspectorBody pose="bust" />
        </g>
        <g transform="translate(1600 1040) scale(2.4)" filter="url(#outlineRed)">
          <PersonBody pose={POSES["stand-front"]} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
