// Episode engine: an advisory's scenes.json + timings.json (+ optional episode patches)
// -> segments of lines with resolved shots. This file is part of the shared kit and must
// stay free of episode-specific values; those live in src/episodes/<slug>/patches.ts.

import type { EpisodeAssets } from "./episode-context";

export type El = { el: string; [k: string]: any };
export type Shot = { id: string; type: string; desc?: string; elements?: El[]; camera?: any; accent?: string; style?: string; dim?: number; doc?: any; plan?: any; [k: string]: any };
export type Line = { id: string; beat: string; directive: number | null; voice: string; caption: string; shot: string; pauseAfter: number; emphasis: string[]; sfx: string | null; transitionIn: string };
export type Timing = { id: string; startSec: number; audioSec: number; endSec: number; startFrame: number; endFrame: number; audioFrames: number };
export type Scenes = { meta: any; beats: any[]; lines: Line[]; shots: Record<string, Omit<Shot, "id">> };
export type Timings = { estimated?: boolean; fps: number; totalFrames: number; pauseScale: number; lines: Timing[]; endCard: { startFrame: number; durationFrames: number } };

export type SubShot = { line: Line; timing: Timing; shot: Shot; localStart: number; localEnd: number };
export type Segment = { index: number; startFrame: number; endFrame: number; subs: SubShot[]; transitionIn: string };

// Episode-level corrections, applied on top of scenes.json without editing it.
export type EpisodePatches = {
  // Per-shot element patches (positions, extra props a shot's `desc` asks for).
  elements?: Record<string, (els: El[]) => El[]>;
  // Per-shot doc/plan overrides.
  overrides?: Record<string, Partial<Shot>>;
  // Lift close-up corners/inspectors that stand on y=860 (the caption zone) to y=815.
  liftCloseUps?: boolean;
};

export type EpisodeInput = { id: string; slug: string; scenes: unknown; timings: unknown; patches?: EpisodePatches; assets?: EpisodeAssets };

export type EpisodeMeta = {
  id: string;
  slug: string;
  advisory: string;
  title: string;
  endStamp: string;
  endSub: string;
};

export type Episode = {
  id: string;
  slug: string;
  meta: EpisodeMeta;
  scenes: Scenes;
  timings: Timings;
  segments: Segment[];
  resolveShot: (id: string) => Shot;
  assets?: EpisodeAssets;
};

const merge = (a: any, b: any) => ({ ...(a ?? {}), ...(b ?? {}) });

const liftCloseUps = (els: El[]) =>
  els.map((e) => ((e.el === "corner" || e.el === "inspector") && e.y === 860 ? { ...e, y: 815, h: e.el === "inspector" ? Math.round(e.h * 0.94) : e.h } : e));

export function createEpisode(input: EpisodeInput): Episode {
  const scenes = input.scenes as Scenes;
  const timings = input.timings as Timings;
  const patches = input.patches ?? {};
  const cache: Record<string, Shot> = {};

  function resolveShot(id: string): Shot {
    if (cache[id]) return cache[id];
    const raw = { ...(scenes.shots[id] as any), id };
    let shot: Shot = raw;
    if (raw.same_as) {
      const base = resolveShot(raw.same_as);
      shot = {
        ...base,
        ...raw,
        elements: raw.elements ?? base.elements,
        camera: raw.camera ?? base.camera,
        accent: raw.accent ?? base.accent,
        // A same_as document is the same sheet already on screen: no entry animation,
        // inherited highlights shown complete, inherited stamps already landed.
        doc: base.doc ? { ...merge(base.doc, raw.doc), anim: raw.doc?.anim, inherited: true, ownStamp: !!raw.doc?.stamp } : raw.doc,
        plan: base.plan ? merge(base.plan, raw.plan) : raw.plan,
      } as Shot;
      if (raw.add) shot.elements = [...(shot.elements ?? []), ...raw.add];
    }
    const patch = patches.elements?.[id];
    if (patch && shot.elements) shot = { ...shot, elements: patch(shot.elements) };
    if (patches.liftCloseUps && shot.elements) shot = { ...shot, elements: liftCloseUps(shot.elements) };
    const o = patches.overrides?.[id];
    if (o) shot = { ...shot, doc: o.doc ? merge(shot.doc, o.doc) : shot.doc, plan: o.plan ? merge(shot.plan, o.plan) : shot.plan };
    cache[id] = shot;
    return shot;
  }

  function buildSegments(): Segment[] {
    const segs: Segment[] = [];
    scenes.lines.forEach((line, i) => {
      const timing = timings.lines[i];
      if (timing.id !== line.id) throw new Error(`timings out of sync at ${line.id}`);
      const shot = resolveShot(line.shot);
      if (line.transitionIn === "hold" && segs.length) {
        const seg = segs[segs.length - 1];
        seg.subs.push({ line, timing, shot, localStart: timing.startFrame - seg.startFrame, localEnd: timing.endFrame - seg.startFrame });
        seg.endFrame = timing.endFrame;
      } else {
        segs.push({ index: segs.length, startFrame: timing.startFrame, endFrame: timing.endFrame, transitionIn: line.transitionIn, subs: [{ line, timing, shot, localStart: 0, localEnd: timing.endFrame - timing.startFrame }] });
      }
    });
    const end = timings.endCard;
    const endShotId = scenes.meta?.endCard?.shot ?? "END";
    segs.push({
      index: segs.length,
      startFrame: end.startFrame,
      endFrame: end.startFrame + end.durationFrames,
      transitionIn: "cut",
      subs: [
        {
          line: { id: "END", beat: "end", directive: null, voice: "", caption: "", shot: endShotId, pauseAfter: 0, emphasis: [], sfx: "stamp", transitionIn: "cut" },
          timing: { id: "END", startSec: 0, audioSec: 0, endSec: 0, startFrame: end.startFrame, endFrame: end.startFrame + end.durationFrames, audioFrames: 0 },
          shot: resolveShot(endShotId),
          localStart: 0,
          localEnd: end.durationFrames,
        },
      ],
    });
    return segs;
  }

  const endShot = (scenes.shots[scenes.meta?.endCard?.shot ?? "END"] ?? {}) as any;
  const meta: EpisodeMeta = {
    id: input.id,
    slug: input.slug,
    advisory: scenes.meta?.advisory ?? input.id,
    title: scenes.meta?.title ?? "",
    endStamp: endShot.stamp ? `${String(endShot.stamp).replace(/\.$/, "")}.` : "ONGOING.",
    endSub: endShot.sub ?? "",
  };

  return { id: input.id, slug: input.slug, meta, scenes, timings, segments: buildSegments(), resolveShot, assets: input.assets };
}
