// Advisory 0001 — "If Your Cat Ever Stares At An Empty Corner… DO NOT LOOK".
// Content lives in advisories/0001-cat-corner/; this file only wires it into the kit.
import { createEpisode } from "../../engine";
import scenes from "../../../../advisories/0001-cat-corner/scenes.json";
import timings from "../../../../advisories/0001-cat-corner/timings.json";
import { patches } from "./patches";
import { Thumbnail } from "./Thumbnail";
import { assets } from "./assets";

export const episode = createEpisode({ id: "0001", slug: "0001-cat-corner", scenes, timings, patches, assets });
export { Thumbnail };
