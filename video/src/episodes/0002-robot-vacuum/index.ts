// Advisory 0002: "If Your Robot Vacuum Ever Starts Cleaning At 3 AM… DO NOT TURN ON THE LIGHT".
// Content lives in advisories/0002-robot-vacuum/; this file only wires it into the kit.
import { createEpisode } from "../../engine";
import scenes from "../../../../advisories/0002-robot-vacuum/scenes.json";
import timings from "../../../../advisories/0002-robot-vacuum/timings.json";
import { patches } from "./patches";
import { Thumbnail } from "./Thumbnail";
import { assets } from "./assets";

export const episode = createEpisode({ id: "0002", slug: "0002-robot-vacuum", scenes, timings, patches, assets });
export { Thumbnail };
