// Advisory {{ID}}: episode-specific assets. Use the kit first (brand/catalog.json and
// brand/reference/*.png). Add something here only when this advisory needs a thing the kit
// can't draw, and declare its name in scenes.json meta.customElements / meta.customShots.
//
// Rules (brand/BRAND.md §5): palette tokens only, figures solid fg with GLOW, furniture as
// outline-on-surface with 2–3 px strokes, annotations 3 px blue/red, people keep square
// heads, stand it on the ground line next to a 360 px person to check the scale.
//
// Example element, used in scenes.json as { "el": "radiator", "x": 1300, "y": 780, "h": 260 }:
//
//   import { C } from "../../theme";
//   import type { CustomElementProps } from "../../episode-context";
//   const Radiator: React.FC<CustomElementProps> = ({ e }) => {
//     const h = e.h ?? 260, w = h * 1.4;
//     return (
//       <g transform={`translate(${e.x - w / 2} ${e.y - h})`} fill={C.surface} stroke={C.line} strokeWidth={3}>
//         <rect width={w} height={h} rx={10} />
//         {Array.from({ length: 7 }, (_, i) => <line key={i} x1={(i + 1) * w / 8} y1={16} x2={(i + 1) * w / 8} y2={h - 16} />)}
//       </g>
//     );
//   };
//   export const assets: EpisodeAssets = { elements: { radiator: Radiator } };
//
// A whole new shot type gets CustomShotProps ({ shot, frame, dur, fps, audioFrames }) and
// goes in `shots`, keyed by the type name used in scenes.json.
import type { EpisodeAssets } from "../../episode-context";

export const assets: EpisodeAssets = {};
