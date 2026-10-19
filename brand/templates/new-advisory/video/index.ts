// Advisory {{ID}}: "{{TITLE}}".
// Content lives in advisories/{{SLUG}}/; this file only wires it into the kit.
import { createEpisode } from "../../engine";
import scenes from "../../../../advisories/{{SLUG}}/scenes.json";
import timings from "../../../../advisories/{{SLUG}}/timings.json";
import { patches } from "./patches";
import { Thumbnail } from "./Thumbnail";
import { assets } from "./assets";

export const episode = createEpisode({ id: "{{ID}}", slug: "{{SLUG}}", scenes, timings, patches, assets });
export { Thumbnail };
