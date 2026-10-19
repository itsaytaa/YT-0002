// Advisory 0001 needed no episode-specific assets: everything is drawn by the shared kit.
// Template for a new element kind (use it in scenes.json as { "el": "radiator", ... }):
//
//   import { C } from "../../theme";
//   const Radiator: React.FC<CustomElementProps> = ({ e }) => (
//     <g transform={`translate(${e.x} ${e.y})`} stroke={C.line} strokeWidth={3} fill={C.surface}>…</g>
//   );
//   export const assets: EpisodeAssets = { elements: { radiator: Radiator } };
//
// Follow brand/BRAND.md → "Making a new asset": palette tokens only, line weights 3 px,
// fg figures get the GLOW filter, furniture stays outline-on-surface, people keep square heads.
import type { EpisodeAssets } from "../../episode-context";

export const assets: EpisodeAssets = {};
