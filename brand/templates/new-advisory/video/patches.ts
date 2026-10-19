// Advisory {{ID}} only: corrections applied on top of scenes.json by the engine, for when
// a shot's structured fields don't match its `desc` after review. Prefer fixing scenes.json
// directly while the advisory is still being written; use patches once the voice is
// generated and the timings are locked. Never change kit files for one episode.
import type { EpisodePatches } from "../../engine";

export const patches: EpisodePatches = {
  // elements: { S12: (els) => els.map((e) => (e.el === "person" ? { ...e, x: 700 } : e)) },
  // overrides: { S20: { doc: { anim: "slide-out" } } },
};
