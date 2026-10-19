// The Video composition: segments (line + its holds) with camera, transitions,
// captions, HUD, grain/vignette, voice-over, sound effects and the drone bed.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./theme";
import { easeInOut, lerp, prog, rand } from "./anim";
import type { Episode, Segment } from "./engine";
import { getEpisode } from "./episodes";
import { EpisodeMetaContext, EpisodeAssetsContext, useEpisodeAssets } from "./episode-context";
import { Defs } from "./figures/Defs";
import { Tableau } from "./shots/Tableau";
import { DirectiveCard, EndCard, STAMP_LAND } from "./shots/Cards";
import { Doc, docFocusPoint } from "./shots/Doc";
import { CaseFile, Floorplan, CounterShot, Calendar, Seal, lampClickFrames } from "./shots/Misc";
import { Hud, Caption, Grain, Vignette, CaptionScrim } from "./overlays/Overlays";
import { loadFonts } from "./fonts";
import audioCfg from "../../brand/audio.json";

loadFonts();

const SCAN = 12;
const CARBON = 6;
const SLIP = 8;

function currentSub(seg: Segment, frame: number) {
  let k = 0;
  for (let i = 0; i < seg.subs.length; i++) if (frame >= seg.subs[i].localStart) k = i;
  return { k, sub: seg.subs[k] };
}

const sameCam = (a: any, b: any) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function camera(seg: Segment, frame: number) {
  const { k, sub } = currentSub(seg, frame);
  const cam = sub.shot.camera;
  const type = sub.shot.type;
  const segDur = seg.endFrame - seg.startFrame;
  if (!cam) {
    if (type === "tableau") return { s: lerp(1, 1.015, frame / segDur), px: 0, py: 0, cx: 960, cy: 540 };
    if (type === "doc" || type === "case-file" || type === "counter" || type === "calendar" || type === "seal" || type === "floorplan") return { s: lerp(1, 1.012, frame / segDur), px: 0, py: 0, cx: 960, cy: 540 };
    return { s: 1, px: 0, py: 0, cx: 960, cy: 540 };
  }
  let j = k;
  while (j > 0 && sameCam(seg.subs[j - 1].shot.camera, cam)) j--;
  const t = frame - seg.subs[j].localStart;
  const d = seg.subs[j].localEnd - seg.subs[j].localStart;
  const held = j < k; // a hold after the move: stay at the end state, keep a tiny drift
  const p = held ? 1 : prog(t, 0, d, easeInOut);
  const drift = held ? lerp(0, 0.01, (frame - sub.localStart) / Math.max(1, sub.localEnd - sub.localStart)) : 0;
  switch (cam.move) {
    case "push":
      return { s: lerp(cam.from, cam.to, prog(t, 0, d, (x) => x)), px: 0, py: 0, cx: 960, cy: 540 };
    case "pull-back":
      return { s: lerp(cam.from, cam.to, p) + drift * 0.3, px: (cam.pan_x ?? 0) * p, py: 0, cx: 960, cy: 540 };
    case "drift":
      return { s: 1.02, px: lerp(-(cam.dx ?? 30) / 2, (cam.dx ?? 30) / 2, prog(t, 0, d, (x) => x)), py: 0, cx: 960, cy: 540 };
    case "pan-to": {
      const fp = docFocusPoint(sub.shot.doc);
      const pz = prog(t, 4, 30, easeInOut);
      return { s: lerp(1, cam.zoom ?? 1.6, pz), px: lerp(0, fp.x - 960, pz), py: lerp(0, fp.y - 540, pz), cx: 960, cy: 540 };
    }
    default:
      return { s: 1, px: 0, py: 0, cx: 960, cy: 540 };
  }
}

const ShotView: React.FC<{ seg: Segment; frame: number }> = ({ seg, frame }) => {
  const { fps } = useVideoConfig();
  const assets = useEpisodeAssets();
  const { sub } = currentSub(seg, frame);
  const shot = sub.shot;
  const local = frame - sub.localStart;
  const dur = sub.localEnd - sub.localStart;
  const audioFrames = sub.timing.audioFrames;
  switch (shot.type) {
    case "tableau":
      return (
        <>
          <Tableau subs={seg.subs} frame={frame} fps={fps} />
          {shot.dim ? <rect x={-2000} y={-2000} width={6000} height={6000} fill="#000" opacity={shot.dim * 0.45} /> : null}
        </>
      );
    case "directive-card":
      return <DirectiveCard n={shot.n} title={shot.title} frame={local} audioFrames={audioFrames} />;
    case "addendum-card":
      return <DirectiveCard title="ADDENDUM" frame={local} audioFrames={audioFrames} addendum />;
    case "doc":
      return <Doc doc={shot.doc} frame={local} fps={fps} dur={dur} audioFrames={audioFrames} id={shot.id} />;
    case "case-file":
      return <CaseFile shot={shot} frame={local} />;
    case "floorplan":
      return <Floorplan plan={shot.plan} frame={local} fps={fps} dur={dur} />;
    case "counter":
      return <CounterShot shot={shot} frame={local} fps={fps} dur={dur} />;
    case "calendar":
      return <Calendar shot={shot} frame={local} dur={dur} />;
    case "seal":
      return <Seal frame={local} fps={fps} />;
    case "end-card":
      return <EndCard frame={local} dur={dur} />;
    default: {
      // Episode-specific shot types (src/episodes/<slug>/assets.tsx).
      const Custom = assets.shots?.[shot.type];
      return Custom ? <Custom shot={shot} frame={local} dur={dur} fps={fps} audioFrames={audioFrames} /> : null;
    }
  }
};

const SegmentScene: React.FC<{ seg: Segment; frame: number; dx?: number; dy?: number }> = ({ seg, frame, dx = 0, dy = 0 }) => {
  const cam = camera(seg, frame);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Defs />
      <g transform={`translate(${dx} ${dy}) translate(${cam.cx} ${cam.cy}) scale(${cam.s}) translate(${-cam.cx - cam.px} ${-cam.cy - cam.py})`}>
        <ShotView seg={seg} frame={frame} />
      </g>
    </svg>
  );
};

// One segment with its entry transition. `frame` is local to the segment.
const SegmentView: React.FC<{ seg: Segment }> = ({ seg }) => {
  const frame = useCurrentFrame();
  const slip = seg.subs[0].shot.style === "slip" || seg.transitionIn === "slip";
  const tr = seg.transitionIn;
  const base = <SegmentScene seg={seg} frame={frame} />;
  let content: React.ReactNode = base;
  if (tr === "carbon" && frame < CARBON) {
    content = (
      <>
        {base}
        <div style={{ position: "absolute", inset: 0, opacity: 0.5, mixBlendMode: "screen", filter: "grayscale(1) sepia(1) hue-rotate(165deg) saturate(4) brightness(0.9)" }}>
          <SegmentScene seg={seg} frame={frame} dx={6} dy={-3} />
        </div>
        {[0, 1, 2].slice(0, 2 + (frame % 2)).map((i) => (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 120 + rand(frame * 3 + i) * 760, height: 2, background: C.blue, opacity: 0.55 }} />
        ))}
      </>
    );
  }
  if (slip && frame < SLIP) {
    const bands = 7;
    content = (
      <>
        {Array.from({ length: bands }, (_, i) => {
          const top = (i / bands) * 1080, h = 1080 / bands;
          const off = (rand(frame * 13 + i * 7) * 2 - 1) * 20;
          return (
            <div key={i} style={{ position: "absolute", inset: 0, clipPath: `inset(${top}px 0 ${1080 - top - h}px 0)`, transform: `translateX(${off}px)` }}>
              {base}
            </div>
          );
        })}
        <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: [0.18, 0, 0.1, 0.02, 0.14, 0, 0.06, 0][frame] ?? 0, mixBlendMode: "screen" }} />
      </>
    );
  }
  const wrapped = <div style={{ position: "absolute", inset: 0, filter: slip ? "grayscale(1) contrast(0.9) brightness(0.92)" : undefined }}>{content}</div>;
  if (tr === "scan" && frame < SCAN) {
    const p = frame / SCAN;
    const y = p * 1080;
    return (
      <AbsoluteFill>
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 ${1080 - y}px 0)`, background: C.bg }}>{wrapped}</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: y - 1, height: 2, background: "#fff", boxShadow: `0 0 40px 12px ${C.blue}, 0 0 12px 2px ${C.blue}` }} />
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{ background: C.bg }}>{wrapped}</AbsoluteFill>;
};

// ------------------------------------------------------------------ audio
type Sfx = { frame: number; name: string; volume: number };
const LV = audioCfg.sfx.levels as Record<string, number>;

export function sfxEvents(fps: number, ep: Episode): Sfx[] {
  const ev: Sfx[] = [];
  ep.segments.forEach((seg) => {
    if (seg.transitionIn === "scan") ev.push({ frame: seg.startFrame, name: "scan", volume: LV.scan });
    for (const sub of seg.subs) {
      const { line, timing, shot } = sub;
      const at = timing.startFrame;
      const span = timing.endFrame - timing.startFrame;
      switch (line.sfx) {
        case "stamp":
          ev.push({ frame: at + STAMP_LAND, name: "stamp", volume: LV.stamp });
          break;
        case "tick":
          for (let f = 0; f < span; f += fps) ev.push({ frame: at + f, name: "tick", volume: LV.tick });
          break;
        case "click":
          if (shot.type === "floorplan") for (const f of lampClickFrames(fps)) ev.push({ frame: at + f, name: "click", volume: LV.click });
          else ev.push({ frame: at + 2, name: "click", volume: LV.click });
          break;
        case "static":
        case "page":
        case "scan":
          ev.push({ frame: at, name: line.sfx, volume: LV[line.sfx] });
          break;
        default:
          break;
      }
      // The REDACTED stamp in SLIP3 lands after the redaction bar (see Doc).
      if (shot.type === "doc" && shot.doc?.anim === "redact-line" && shot.doc?.stamp) {
        const redactStart = Math.max(16, timing.audioFrames * 0.28);
        ev.push({ frame: at + Math.round(redactStart + 14 + STAMP_LAND), name: "stamp", volume: LV.stamp * 0.75 });
      }
    }
  });
  return ev;
}

function droneVolume(frame: number, fps: number, ep: Episode) {
  const { scenes, timings } = ep;
  const base = 0.18;
  const total = timings.totalFrames;
  const end = timings.endCard.startFrame;
  let v = base * prog(frame, 0, 2 * fps, (x) => x);
  if (frame > end) v *= 1 - prog(frame, end, total, (x) => x);
  scenes.lines.forEach((l, i) => {
    if (l.sfx !== "silence") return;
    const t = timings.lines[i];
    const a = t.startFrame, b = t.endFrame;
    if (frame >= a && frame < b) v *= 1 - prog(frame, a, a + 0.3 * fps, (x) => x);
    else if (frame >= b) v *= prog(frame, b, b + 1.0 * fps, (x) => x);
  });
  return v;
}

export const Video: React.FC<{ ep: string }> = ({ ep: epId }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ep = getEpisode(epId);
  const { scenes, timings, segments: SEGMENTS } = ep;
  const lineIdx = timings.lines.findIndex((t) => frame >= t.startFrame && frame < t.endFrame);
  const inEnd = frame >= timings.endCard.startFrame;
  const line = lineIdx >= 0 ? scenes.lines[lineIdx] : null;
  const seg = SEGMENTS.find((s) => frame >= s.startFrame && frame < s.endFrame);
  const sub = seg ? currentSub(seg, frame - seg.startFrame).sub : null;
  const isCard = sub && (sub.shot.type === "directive-card" || sub.shot.type === "addendum-card");
  const directive = line?.directive ?? null;
  const carbonGhost = seg && seg.transitionIn === "carbon" && frame - seg.startFrame < CARBON;
  const firstLineStart = timings.lines[0].startFrame;
  return (
    <EpisodeMetaContext.Provider value={ep.meta}>
    <EpisodeAssetsContext.Provider value={ep.assets ?? {}}>
    <AbsoluteFill style={{ background: C.bg }}>
      {SEGMENTS.map((s, i) => {
        const next = SEGMENTS[i + 1];
        const extra = next && next.transitionIn === "scan" ? SCAN : 0;
        return (
          <Sequence key={i} from={s.startFrame} durationInFrames={s.endFrame - s.startFrame + extra} layout="none">
            <SegmentView seg={s} />
          </Sequence>
        );
      })}
      {/* Lead-in before the first line: hold the first shot's opening frame. */}
      {frame < firstLineStart && <AbsoluteFill style={{ background: C.bg }} />}
      <CaptionScrim />
      {line && !isCard && !inEnd && <Caption caption={line.caption} emphasis={line.emphasis} red={sub?.shot.accent === "red"} ghost={!!carbonGhost} />}
      {!inEnd && <Hud directive={directive} />}
      <Vignette />
      <Grain frame={frame} />
      {/* fade from black at the very start */}
      <AbsoluteFill style={{ background: "#000", opacity: 1 - prog(frame, firstLineStart, firstLineStart + 15, (x) => x), pointerEvents: "none" }} />

      <Audio src={staticFile("sfx/drone.wav")} volume={(f) => droneVolume(f, fps, ep)} />
      {/* Estimated timings (scripts/timings.mjs --estimate) have no voice files yet. */}
      {!timings.estimated && scenes.lines.map((l, i) => (
        <Sequence key={l.id} from={timings.lines[i].startFrame} durationInFrames={timings.lines[i].audioFrames + 3} layout="none">
          <Audio src={staticFile(`episodes/${ep.slug}/lines/${l.id}.wav`)} />
        </Sequence>
      ))}
      {sfxEvents(fps, ep).map((e, i) => (
        <Sequence key={i} from={e.frame} durationInFrames={Math.round(fps * 0.6)} layout="none">
          <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
        </Sequence>
      ))}
      <Sequence from={timings.endCard.startFrame + STAMP_LAND} durationInFrames={Math.round(fps * 0.6)} layout="none">
        <Audio src={staticFile("sfx/stamp.wav")} volume={LV.stamp} />
      </Sequence>
    </AbsoluteFill>
    </EpisodeAssetsContext.Provider>
    </EpisodeMetaContext.Provider>
  );
};
