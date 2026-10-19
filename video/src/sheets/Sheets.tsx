// Reference sheets: the channel's characters, props, layout and cards, drawn by the SAME
// engine and components as the videos. Rendered to brand/reference/*.png and used as
// golden images (scripts/check-reference.mjs fails when the kit drifts from them).
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, GROUND, style } from "../theme";
import { Defs } from "../figures/Defs";
import { Tableau } from "../shots/Tableau";
import { DirectiveCard, EndCard } from "../shots/Cards";
import { Doc } from "../shots/Doc";
import { CaseFile, CounterShot, Floorplan, Seal, Calendar } from "../shots/Misc";
import { Hud, Caption, CaptionScrim, Grain, Vignette } from "../overlays/Overlays";
import { EpisodeMetaContext } from "../episode-context";
import type { El, EpisodeMeta, SubShot } from "../engine";
import { getEpisode } from "../episodes";
import { loadFonts } from "../fonts";

loadFonts();

const FPS = 30;
const SHEET_META: EpisodeMeta = { id: "000X", slug: "reference", advisory: "000X", title: "", endStamp: "ONGOING.", endSub: "NEXT ADVISORY: 000X" };

// A tableau of arbitrary elements, frozen at `frame` (animations complete).
function sub(elements: El[], dur = 90): SubShot[] {
  return [
    {
      line: { id: "REF", beat: "ref", directive: null, voice: "", caption: "", shot: "REF", pauseAfter: 0, emphasis: [], sfx: null, transitionIn: "cut" },
      timing: { id: "REF", startSec: 0, audioSec: dur / FPS, endSec: dur / FPS, startFrame: 0, endFrame: dur, audioFrames: dur },
      shot: { id: "REF", type: "tableau", elements },
      localStart: 0,
      localEnd: dur,
    },
  ];
}

const Title: React.FC<{ text: string; sub?: string }> = ({ text, sub: s }) => (
  <>
    <text x={60} y={58} fontFamily={FONT.mono} fontWeight={600} fontSize={22} letterSpacing="0.22em" fill={C.blue}>
      NOT COVERED · {text}
    </text>
    {s && (
      <text x={1860} y={58} textAnchor="end" fontFamily={FONT.mono} fontWeight={500} fontSize={16} letterSpacing="0.14em" fill={C.dim}>
        {s}
      </text>
    )}
  </>
);

const Lbl: React.FC<{ x: number; y: number; t: string; s?: string }> = ({ x, y, t, s }) => (
  <g fontFamily={FONT.mono} textAnchor="middle">
    <text x={x} y={y} fontSize={15} fontWeight={600} letterSpacing="0.08em" fill={C.grey}>
      {t}
    </text>
    {s && (
      <text x={x} y={y + 19} fontSize={13} letterSpacing="0.06em" fill={C.dim}>
        {s}
      </text>
    )}
  </g>
);

const Ground: React.FC<{ y: number }> = ({ y }) => <line x1={40} x2={1880} y1={y} y2={y} stroke={C.line} strokeOpacity={0.35} strokeDasharray="4 8" />;

const Sheet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <EpisodeMetaContext.Provider value={SHEET_META}>
    <AbsoluteFill style={{ background: C.bg }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <Defs />
        {children}
      </svg>
    </AbsoluteFill>
  </EpisodeMetaContext.Provider>
);

// ------------------------------------------------------------------ characters
// Shown at one common scale (0.62 of video scale) so relative sizes are true:
// person h 360 -> 223, cat h 170 -> 105, inspector h 520 -> 322.
const K = 0.62;
const P = 360 * K, CT = 170 * K, IN = 520 * K;

export const CharacterSheet: React.FC = () => {
  const r1 = 320, r2 = 590, r3 = 1020;
  const persons: Array<[string, string, El]> = [
    ["stand", "front", { el: "person", pose: "stand", facing: "front", x: 110, y: r1, h: P }],
    ["stand", "right", { el: "person", pose: "stand", facing: "right", x: 260, y: r1, h: P }],
    ["stand", "down-right", { el: "person", pose: "stand", facing: "down-right", x: 410, y: r1, h: P }],
    ["kneel", "right", { el: "person", pose: "kneel", facing: "right", x: 570, y: r1, h: P }],
    ["push", "right", { el: "person", pose: "push", facing: "right", x: 750, y: r1, h: P }],
    ["shrug", "front", { el: "person", pose: "shrug", facing: "front", x: 930, y: r1, h: P }],
    ["sit-floor", "side", { el: "person", pose: "sit-floor", facing: "right", x: 1090, y: r1, h: P * 0.72 }],
    ["sit-floor", "back", { el: "person", pose: "sit-floor", facing: "back", x: 1240, y: r1, h: P * 0.72 }],
    ["sit-floor", "back · head down", { el: "person", pose: "sit-floor", facing: "back", head: "down", x: 1390, y: r1, h: P * 0.72 }],
    ["stand", "red outline", { el: "person", pose: "stand", facing: "front", outline: "red", x: 1540, y: r1, h: P }],
    ["crowd", "dim", { el: "crowd", n: 2, x: 1740, y: r1, h: P * 0.8, spacing: 110, facing: "right", color: "dim" }],
  ];
  const cats: Array<[string, string, El]> = [
    ["sit-back", "from behind", { el: "cat", pose: "sit-back", x: 120, y: r2, h: CT }],
    ["sit-side", "right", { el: "cat", pose: "sit-side", facing: "right", x: 290, y: r2, h: CT }],
    ["stare", "ears forward", { el: "cat", pose: "stare", facing: "right", x: 460, y: r2, h: CT }],
    ["sit-front", "eyes heavy", { el: "cat", pose: "sit-front", eyes: "heavy", x: 620, y: r2, h: CT }],
    ["loaf", "away", { el: "cat", pose: "loaf", facing: "away", x: 790, y: r2, h: CT * 0.65 }],
    ["walk", "right", { el: "cat", pose: "walk", facing: "right", x: 980, y: r2, h: CT }],
    ["sleep", "curled", { el: "cat", pose: "sleep", x: 1170, y: r2, h: CT * 0.7 }],
    ["stare", "age old", { el: "cat", pose: "stare", facing: "right", age: "old", x: 1340, y: r2, h: CT }],
    ["face-close", "front", { el: "cat", pose: "face-close", x: 1640, y: r2 - 95, h: 200 }],
  ];
  const insp: Array<[string, string, El]> = [
    ["inspector", "stand", { el: "inspector", pose: "stand", x: 150, y: r3, h: IN, opacity: 1 }],
    ["inspector", "corner (dim)", { el: "inspector", pose: "corner", x: 370, y: r3, h: IN, opacity: 0.6 }],
    ["inspector", "bust", { el: "inspector", pose: "bust", x: 620, y: r3 - 60, h: IN * 0.5 }],
  ];
  const seated: El[] = [
    { el: "armchair", x: 940, y: r3, w: 320 * K },
    { el: "person", pose: "sit-chair", facing: "right", x: 940, y: r3 - 12, h: 300 * K },
    { el: "sofa", x: 1250, y: r3, w: 480 * K },
    { el: "person", pose: "read", facing: "right", x: 1220, y: r3 - 25, h: 300 * K },
    { el: "bed", x: 1600, y: r3, w: 460 * K },
    { el: "person", pose: "lie-bed", x: 1575, y: r3 - 75, h: 120 * K },
  ];
  const els = [...persons.map((p) => p[2]), ...cats.map((c) => c[2]), ...insp.map((i) => i[2]), ...seated];
  return (
    <Sheet>
      <Title text="CHARACTER SHEET" sub={`ONE SCALE (×${K} OF VIDEO) · GROUND LINES DASHED`} />
      {[r1, r2, r3].map((y) => (
        <Ground key={y} y={y} />
      ))}
      <Tableau subs={sub(els)} frame={60} fps={FPS} />
      {persons.map(([t, s, e]) => (
        <Lbl key={t + s} x={e.x} y={r1 + 30} t={t} s={s} />
      ))}
      {cats.map(([t, s, e]) => (
        <Lbl key={t + s} x={e.x} y={r2 + 30} t={t} s={s} />
      ))}
      <Lbl x={150} y={r3 + 30} t="inspector" s="stand" />
      <Lbl x={370} y={r3 + 30} t="inspector" s="corner · dim" />
      <Lbl x={620} y={r3 + 30} t="inspector" s="bust" />
      <Lbl x={940} y={r3 + 30} t="sit-chair" s="+ armchair" />
      <Lbl x={1250} y={r3 + 30} t="read" s="+ sofa" />
      <Lbl x={1600} y={r3 + 30} t="lie-bed" s="+ bed" />
      <text x={1860} y={r3 - 330} textAnchor="end" fontFamily={FONT.mono} fontSize={14} fill={C.dim} letterSpacing="0.06em">
        <tspan x={1860}>VIDEO HEIGHTS: PERSON 360 · CAT 170 · INSPECTOR 520</tspan>
        <tspan x={1860} dy={22}>GROUND Y {GROUND} · PEOPLE HAVE SQUARE HEADS, NO FACES</tspan>
      </text>
    </Sheet>
  );
};

// ------------------------------------------------------------------ props & marks
export const PropSheet: React.FC = () => {
  const r1 = 330, r2 = 640, r3 = 1000;
  const items: Array<[string, El[], number, number]> = [
    ["bookcase", [{ el: "bookcase", x: 100, y: r1, h: 230 }], 100, r1],
    ["sofa", [{ el: "sofa", x: 300, y: r1, w: 230 }], 300, r1],
    ["armchair", [{ el: "armchair", x: 500, y: r1, w: 150 }], 500, r1],
    ["bed", [{ el: "bed", x: 700, y: r1, w: 210 }], 700, r1],
    ["floor-lamp · on", [{ el: "floor-lamp", x: 930, y: r1, h: 230, state: "on" }], 930, r1],
    ["floor-lamp · off", [{ el: "floor-lamp", x: 1110, y: r1, h: 230 }], 1110, r1],
    ["window · moon", [{ el: "window", x: 1290, y: r1 - 130, sky: "moon", w: 160 }], 1290, r1],
    ["window · day", [{ el: "window", x: 1490, y: r1 - 130, sky: "day", w: 160 }], 1490, r1],
    ["door + mat", [{ el: "door", x: 1740, y: r1, h: 230, state: "closed" }, { el: "mat", x: 1740, y: r1 + 6, w: 130 }], 1740, r1],
    ["corner · plain", [{ el: "corner", x: 110, y: r2 - 50, w: 150, h: 190 }], 110, r2],
    ["corner · lit", [{ el: "corner", x: 290, y: r2 - 50, w: 150, h: 190, variant: "lit" }], 290, r2],
    ["corner · washed", [{ el: "corner", x: 470, y: r2 - 50, w: 150, h: 190, variant: "washed" }], 470, r2],
    ["corner · dark", [{ el: "corner", x: 650, y: r2 - 50, w: 150, h: 190, variant: "dark" }], 650, r2],
    ["cat-bed · tag", [{ el: "cat-bed", x: 850, y: r2 - 40, w: 170, tag: "89.99" }], 850, r2],
    ["box (+ cat inside)", [{ el: "box", x: 1050, y: r2, w: 150 }, { el: "cat", pose: "sit-front", x: 1050, y: r2 - 50, h: 110, inside: "box" }], 1050, r2],
    ["clock", [{ el: "clock", x: 1230, y: r2 - 120, r: 70, time: "23:47" }], 1230, r2],
    ["bird", [{ el: "bird", x: 1380, y: r2 - 40 }], 1380, r2],
    ["doc-mini", [{ el: "doc-mini", x: 1530, y: r2 - 130, w: 120 }], 1530, r2],
    ["glow · blue", [{ el: "glow", x: 1740, y: r2 - 110, r: 90, color: "blue", opacity: 0.3 }], 1740, r2],
    ["gaze · dotted", [{ el: "gaze", from: { x: 40, y: r3 - 150 }, to: { x: 220, y: r3 - 90 }, style: "dotted", color: "fg" }], 130, r3],
    ["mark · cross", [{ el: "mark", type: "cross", x: 340, y: r3 - 110, size: 100, color: "red" }], 340, r3],
    ["mark · check", [{ el: "mark", type: "check", x: 520, y: r3 - 110, size: 90, color: "blue" }], 520, r3],
    ["mark · circle", [{ el: "mark", type: "circle", x: 700, y: r3 - 110, size: 100, color: "red" }], 700, r3],
    ["eye", [{ el: "eye", x: 890, y: r3 - 110, w: 150 }], 890, r3],
    ["speech", [{ el: "speech", text: "hello", x: 1110, y: r3 - 130 }], 1110, r3],
    ["thought", [{ el: "thought", text: "?", x: 1360, y: r3 - 130 }], 1360, r3],
    ["boundary", [{ el: "boundary", x1: 1470, y1: r3 - 60, x2: 1590, y2: r3 - 160, color: "blue" }], 1530, r3],
    ["checklist", [{ el: "checklist", x: 1790, y: r3 - 150, w: 150, items: ["KITCHEN ✓", "BEDROOM ☐", "OCCUPANT ☐"] }], 1790, r3],
  ];
  return (
    <Sheet>
      <Title text="PROPS & MARKS" sub="SHARED PROPS · REUSE THESE BEFORE ADDING EPISODE ASSETS" />
      {[r1, r2, r3].map((y) => (
        <Ground key={y} y={y} />
      ))}
      <Tableau subs={sub(items.flatMap((i) => i[1]))} frame={60} fps={FPS} />
      {items.map(([t, , x, y]) => (
        <Lbl key={t} x={x} y={y + 30} t={t} />
      ))}
    </Sheet>
  );
};

// ------------------------------------------------------------------ layout
export const LayoutSheet: React.FC = () => {
  const sa = style.safeArea;
  const scene: El[] = [
    { el: "cat", pose: "stare", x: 520, y: GROUND, h: 170, facing: "right" },
    { el: "bookcase", x: 1240, y: GROUND, h: 440 },
    { el: "corner", x: 1520, y: GROUND, w: 360, h: 520 },
    { el: "gaze", from: "cat.eyes", to: "corner.vertex", style: "dotted", color: "fg" },
  ];
  const guide = { fontFamily: FONT.mono, fontSize: 15, letterSpacing: "0.1em", fill: C.blue } as const;
  return (
    <EpisodeMetaContext.Provider value={SHEET_META}>
      <AbsoluteFill style={{ background: C.bg }}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          <Defs />
          <Tableau subs={sub(scene)} frame={60} fps={FPS} />
        </svg>
        <CaptionScrim />
        <Caption caption="And it stares at the corner by the bookcase." emphasis={["the corner"]} red={false} />
        <Hud directive={3} />
        <Vignette />
        <Grain frame={3} />
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          <rect x={sa.left} y={sa.top} width={sa.right - sa.left} height={sa.bottom - sa.top} fill="none" stroke={C.blue} strokeDasharray="10 8" strokeOpacity={0.7} />
          <text x={sa.left + 8} y={sa.top + 22} {...guide}>SAFE AREA {sa.left}–{sa.right} × {sa.top}–{sa.bottom}</text>
          <rect x={0} y={0} width={1920} height={100} fill={C.blue} fillOpacity={0.06} />
          <text x={960} y={92} textAnchor="middle" {...guide}>HUD ZONE (TOP 100 PX) · DEPARTMENT + ADVISORY · CLASSIFICATION · D1–D6 + AD</text>
          <line x1={0} x2={1920} y1={GROUND} y2={GROUND} stroke={C.red} strokeDasharray="6 6" strokeOpacity={0.8} />
          <text x={sa.left + 8} y={GROUND + 24} {...guide} fill={C.red}>GROUND Y {GROUND}: FIGURES STAND HERE</text>
          <rect x={0} y={860} width={1920} height={140} fill={C.blue} fillOpacity={0.07} />
          <text x={sa.left + 8} y={878} {...guide}>CAPTION ZONE 860–1000 · KEEP SCENE CONTENT ABOVE 820</text>
          <text x={1800} y={150} textAnchor="end" {...guide}>SCENE CONTENT 150–820</text>
        </svg>
      </AbsoluteFill>
    </EpisodeMetaContext.Provider>
  );
};

// ------------------------------------------------------------------ cards & documents
const Cell: React.FC<{ i: number; label: string; children: React.ReactNode }> = ({ i, label, children }) => {
  const col = i % 3, row = Math.floor(i / 3);
  const w = 560, h = 315, x = 110 + col * (w + 20), y = 88 + row * (h + 18);
  return (
    <g>
      <svg x={x} y={y} width={w} height={h} viewBox="0 0 1920 1080">
        <rect width={1920} height={1080} fill={C.bg} />
        {children}
      </svg>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={C.line} strokeOpacity={0.6} />
      <text x={x + 10} y={y + h - 10} fontFamily={FONT.mono} fontSize={14} fontWeight={600} letterSpacing="0.1em" fill={C.grey}>
        {label}
      </text>
    </g>
  );
};

export const CardSheet: React.FC = () => {
  const ep = getEpisode("0001");
  const memo = ep.resolveShot("S06");
  const caseFile = ep.resolveShot("S26");
  const counter = ep.resolveShot("S47");
  const plan = ep.resolveShot("S27");
  const cal = ep.resolveShot("S65");
  return (
    <Sheet>
      <Title text="CARDS, DOCUMENTS & DATA SHOTS" sub="NON-TABLEAU SHOT TYPES" />
      <Cell i={0} label="directive-card">
        <DirectiveCard n={4} title="DO NOT SAY HELLO" frame={120} audioFrames={60} />
      </Cell>
      <Cell i={1} label="addendum-card">
        <DirectiveCard title="ADDENDUM" frame={120} audioFrames={60} addendum />
      </Cell>
      <Cell i={2} label="doc (memo · redactions · highlight)">
        <Doc doc={{ ...memo.doc, anim: undefined }} frame={120} fps={FPS} dur={150} audioFrames={120} id="ref1" />
      </Cell>
      <Cell i={3} label="case-file">
        <CaseFile shot={caseFile} frame={60} />
      </Cell>
      <Cell i={4} label="counter">
        <CounterShot shot={counter} frame={140} fps={FPS} dur={150} />
      </Cell>
      <Cell i={5} label="floorplan">
        <Floorplan plan={plan.plan} frame={140} fps={FPS} dur={150} />
      </Cell>
      <Cell i={6} label="calendar">
        <Calendar shot={cal} frame={140} dur={150} />
      </Cell>
      <Cell i={7} label="seal">
        <Seal frame={90} fps={FPS} />
      </Cell>
      <Cell i={8} label="end-card (stamp word varies per advisory)">
        <EndCard frame={40} dur={120} />
      </Cell>
    </Sheet>
  );
};
