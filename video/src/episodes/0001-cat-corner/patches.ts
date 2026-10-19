// Advisory 0001 only: corrections derived from each shot's `desc` (desc is the authority
// when structured fields and description disagree) and from the contact-sheet review.
// scenes.json is left untouched; these are applied on top by the engine.
import type { El, EpisodePatches } from "../../engine";

export const patches: EpisodePatches = {
  liftCloseUps: true,
  overrides: {
    // "the red VIOLATED stamp on DIRECTIVE 4 pulses once" (stamp already on the page).
    S40: { doc: { stampMode: "pulse" } },
    // "The advisory memo from S06 slides down out of frame (closing)."
    S91: { doc: { anim: "slide-out" } },
    // After S28/S28b the cat sits in the hallway with every lamp on; S30 turns them off.
    S30: { plan: { anim: "lamps-off-sequence", catIn: "hall", startLit: true } },
    S28: { plan: { startLit: true } },
    S28b: { plan: { startLit: true, catIn: "hall" } },
  },
  elements: {
    // S68b: "Window outside cycles quickly through night skies": the sofa-wide set (S10,
    // reused in S67/S68) gets a window so that cycle has somewhere to happen.
    S10: (els: El[]) => [{ el: "window", x: 470, y: 300, w: 230, sky: "moon" }, ...els],
    // S68: "camera pulls back and pans right to reveal the room corner": the corner starts
    // outside the S10 framing, and the blue line runs person -> cat -> corner.
    S68: (els: El[]) =>
      els.map((e) =>
        e.el === "corner" ? { ...e, x: 2060 } : e.el === "boundary" ? { ...e, pts: [{ x: 760, y: 818 }, { x: 1262, y: 818 }, { x: 2040, y: 800 }] } : e,
      ),
    S68b: (els: El[]) => els.map((e) => (e.el === "window" ? { ...e, nightCycle: true } : e)),
    // S07 "a clock beside it with a counter that ticks up to 16 h".
    S07: (els: El[]) => [...els, { el: "clock", x: 1020, y: 440, r: 78, anim: ["spin-fast"] }].map((e) => (e.el === "counter" ? { ...e, x: 1330 } : e)),
    S09: (els: El[]) => els.map((e) => (e.el === "cat" ? { ...e, h: 200, y: 716 } : e.el === "box" ? { ...e, w: 280 } : e.el === "cat-bed" ? { ...e, w: 340 } : e)),
    S11: (els: El[]) => els.map((e) => (e.el === "window" ? { ...e, x: 1180 } : e)),
    S20: (els: El[]) => els.map((e) => (e.el === "bird" ? { ...e, y: 597 } : e)),
    // S33 "pushing the bookcase sideways away from the corner": the person stands on the
    // corner side and pushes it left (it slides dx -220), moving with it.
    S33: (els: El[]) => els.map((e) => (e.el === "person" ? { ...e, x: 1440, facing: "left", followSlide: true } : e)),
    // S49 continues the armchair scene of S41/S44.
    S49: (els: El[]) => [{ el: "armchair", x: 600, y: 780, w: 320 }, ...els],
    S50: (els: El[]) => els.map((e) => (e.el === "window" ? { ...e, x: 1010 } : e)),
    S84: (els: El[]) => els.map((e) => (e.el === "room-iso" ? { ...e, y: 640 } : e)),
    // S85 "Cat staring at the inspector in the corner."
    S85: (els: El[]) => [{ el: "corner", x: 1360, y: 780, w: 380, h: 560, variant: "dark" }, ...els].map((e) => (e.el === "checklist" ? { ...e, x: 1690, y: 400 } : e)),
    S87: (els: El[]) => els.map((e) => (e.el === "sofa" ? { ...e, x: 520, y: 990, w: 820 } : e.el === "cat" ? { ...e, x: 1120 } : e.el === "glow" ? { ...e, x: 560, y: 560 } : e)),
  },
};
