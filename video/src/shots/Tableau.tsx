// Pictogram scene built from a shot's `elements`. Within a segment (a line plus the
// `hold` lines after it) elements that carry over keep their animation clock; elements
// and animations that a hold adds start on their own line.
import React from "react";
import { C } from "../theme";
import { clamp01, ease, easeInOut, lerp, popIn, prog, rand } from "../anim";
import type { El, SubShot } from "../engine";
import { useEpisodeAssets } from "../episode-context";
import { PersonBody, POSES, mixPose, PersonInBed, type Pose } from "../figures/Person";
import { Cat, CatFace, CAT_ANCHORS, catAnchorKey } from "../figures/Cat";
import { InspectorBody } from "../figures/Inspector";
import { Corner, cornerVertex } from "../figures/Corner";
import { Bookcase, Sofa, sofaSeatY, Armchair, armchairSeatY, Bed, FloorLamp, Window, Clock, CatBed, CatBedFront, BoxBack, BoxFront, BookCloseUp, Bird, Door, Mat, DocMini } from "../figures/Props";
import { Gaze, MarkShape, EyeIcon, Label, Bubble, Boundary, GlowEl, Checklist, CounterNumber, RoomIso } from "../figures/Marks";

type Pt = { x: number; y: number };
type Ctx = { fps: number; els: El[]; anchors: Record<string, Pt>; persons: Array<{ x: number; y: number; h: number }>; seats: { y: number; x: number; w: number }[] };
// Time info for one element: t = frames since it appeared, sub = frames since the
// current line started, dur = frames of the line it appeared on, newAnims = animations
// that started on the current line.
type Tm = { t: number; sub: number; dur: number; subDur: number; newAnims: Set<string> };

const animName = (a: any) => (typeof a === "string" ? a : Object.keys(a)[0]);
const animsOf = (e: El): any[] => (Array.isArray(e.anim) ? e.anim : e.anim ? [e.anim] : []);
const animArg = (e: El, name: string) => {
  const a = animsOf(e).find((x) => animName(x) === name);
  return a && typeof a === "object" ? a[name] : a ? {} : null;
};
const has = (e: El, name: string) => animsOf(e).some((a) => animName(a) === name);
const elKey = (e: El) => [e.el, e.pose ?? "", e.x ?? "", e.y ?? "", e.type ?? "", e.text ?? "", e.target ?? "", e.items ? e.items.join() : ""].join("|");
const animT = (e: El, name: string, tm: Tm) => (tm.newAnims.has(name) ? tm.sub : tm.t);
const DRAW = 14;

// Bookcase slide offset (and the small struggle shake while it moves).
function slideOffset(sl: any, st: number, dur: number, fps: number) {
  if (sl.from_dx != null) return { dx: lerp(sl.from_dx, sl.dx ?? 0, prog(st, fps * 0.1, dur * 0.55, easeInOut)), sh: 0 };
  const p = prog(st, fps * 0.2, dur * 0.85, (x) => x);
  return { dx: lerp(0, sl.dx, easeInOut(p)), sh: p > 0 && p < 1 ? Math.sin(st * 2.2) * 2.5 : 0 };
}

const isSeated = (pose: string) => pose === "sit-sofa" || pose === "sit-chair" || pose === "read";

function personPose(e: El, frame: number, tm: Tm, fps: number): Pose {
  const facing = e.facing ?? "front";
  const pose = e.pose ?? "stand";
  if (pose === "stand") {
    const ht = animArg(e, "head-turn");
    if (ht) {
      const p = prog(animT(e, "head-turn", tm), fps * 0.3, fps * 0.3 + tm.dur * 0.7, easeInOut);
      return { ...POSES["stand-side"], head: { ...POSES["stand-side"].head, x: lerp(0, 2, p), w: lerp(20, 17, p) } };
    }
    if (facing === "front" || facing === "back") return POSES["stand-front"];
    if (facing === "down-right") return POSES["stand-down-right"];
    return POSES["stand-side"];
  }
  if (pose === "sit-floor") {
    if (has(e, "sit-down")) {
      const p = prog(animT(e, "sit-down", tm), 6, 26, easeInOut);
      return mixPose(POSES["stand-side-for-sit"], POSES["sit-floor-side"], p);
    }
    if (facing === "back") return e.head === "down" ? POSES["sit-floor-back-down"] : POSES["sit-floor-back"];
    return POSES["sit-floor-side"];
  }
  return POSES[pose] ?? POSES["stand-front"];
}

// Anchors in scene pixels, computed from the element specs.
export function computeAnchors(els: El[]): Ctx["anchors"] {
  const a: Record<string, Pt> = {};
  for (const e of els) {
    if (e.el === "cat" && !a["cat.eyes"]) {
      const s = ((e.h ?? 150) / (e.pose === "sleep" ? 30 : e.pose === "loaf" ? 50 : 100)) * (e.age === "old" ? 0.92 : 1);
      const dir = e.facing === "left" ? -1 : 1;
      const set = CAT_ANCHORS[catAnchorKey(e.pose)];
      for (const [k, [ux, uy]] of Object.entries(set)) a[`cat.${k}`] = { x: e.x + ux * s * dir, y: e.y + uy * s };
    }
    if (e.el === "person" && !a["person.head"]) {
      const s = (e.h ?? 300) / 100;
      const dir = e.facing === "left" ? -1 : 1;
      const seat = els.find((f) => f.el === "sofa" || f.el === "armchair");
      const y = isSeated(e.pose) && seat ? (seat.el === "sofa" ? sofaSeatY(seat.y, seat.w, seat.close) : armchairSeatY(seat.y, seat.w)) : e.y;
      const pose = POSES[e.pose === "stand" ? (e.facing === "front" ? "stand-front" : "stand-side") : e.pose === "sit-floor" ? "sit-floor-back" : e.pose] ?? POSES["stand-front"];
      a["person.head"] = { x: e.x + pose.head.x * s * dir, y: y + pose.head.y * s };
    }
    if (e.el === "corner" && !a["corner.vertex"]) a["corner.vertex"] = cornerVertex(e.x, e.y, e.h);
  }
  return a;
}

const resolvePt = (v: any, ctx: Ctx): Pt => (typeof v === "string" ? ctx.anchors[v] ?? { x: 960, y: 540 } : v);

const ElementView: React.FC<{ e: El; tm: Tm; ctx: Ctx; frame: number; idx: number; slip?: boolean }> = ({ e, tm, ctx, idx, slip }) => {
  const assets = useEpisodeAssets();
  const { fps } = ctx;
  const delay = (e.delay ?? 0) * fps;
  const t = tm.t - delay;
  const baseOpacity = e.opacity ?? 1;
  if (t < 0 && (e.el === "mark" || e.el === "label" || e.el === "speech" || e.el === "thought")) return null;
  if (e.visible_frames) {
    const [a, b] = e.visible_frames;
    const f = tm.t / Math.max(1, tm.dur);
    if (f < a || f > b) return null;
  }
  switch (e.el) {
    case "window": {
      const mixv = e.sky === "moon-to-sun" ? prog(tm.t, 0, tm.dur * 0.85, easeInOut) : 0;
      const moonPos = e.nightCycle ? Math.floor(tm.sub / (fps * 0.45)) % 3 : 0;
      return <Window x={e.x} y={e.y} w={e.w ?? 300} sky={e.sky} mix={mixv} moonPos={moonPos} />;
    }
    case "corner": {
      const br = has(e, "brighten") ? prog(animT(e, "brighten", tm), 4, 28) : 0;
      return <Corner id={`c${idx}`} x={e.x} y={e.y} w={e.w} h={e.h} variant={e.variant} emphasis={e.emphasis} brighten={br} />;
    }
    case "bookcase": {
      const sl = animArg(e, "slide");
      const { dx, sh } = sl ? slideOffset(sl, animT(e, "slide", tm), tm.dur, fps) : { dx: 0, sh: 0 };
      return (
        <g transform={`translate(${dx + sh} 0)`} opacity={baseOpacity}>
          <Bookcase x={e.x} y={e.y} h={e.h} />
        </g>
      );
    }
    case "sofa":
      return <Sofa x={e.x} y={e.y} w={e.w} close={e.close} dent={e.dent} view={e.view} />;
    case "armchair":
      return <Armchair x={e.x} y={e.y} w={e.w} />;
    case "bed":
      return <Bed x={e.x} y={e.y} w={e.w} />;
    case "floor-lamp": {
      let on = e.state === "on" ? 1 : 0;
      if (has(e, "switch-on")) {
        const st = animT(e, "switch-on", tm);
        on = st < 2 ? 0 : st < 4 ? 1 : st < 6 ? 0.15 : 1;
      }
      return <FloorLamp x={e.x} y={e.y} h={e.h} on={on} />;
    }
    case "clock": {
      const [hh, mm] = (e.time ?? "00:00").split(":").map(Number);
      let minutes = hh * 60 + mm;
      let seconds = 12 + Math.floor(tm.t / fps);
      if (has(e, "spin-fast")) {
        const p = prog(animT(e, "spin-fast", tm), 0, tm.dur, (x) => x);
        if (!e.time) minutes = 60 + 6 * 60 * easeInOut(p);
        else minutes += 6 * 60 * easeInOut(p);
        seconds = tm.t * 7;
      }
      if (!has(e, "tick") && !has(e, "spin-fast")) seconds = 31;
      return <Clock x={e.x} y={e.y} r={e.r} minutes={minutes} seconds={seconds} />;
    }
    case "cat-bed": {
      const sw = has(e, "tag-sway") ? 9 * Math.sin(animT(e, "tag-sway", tm) / 4.2) * Math.exp(-animT(e, "tag-sway", tm) / 30) * clamp01(animT(e, "tag-sway", tm) / 3) : 0;
      return <CatBed x={e.x} y={e.y} w={e.w} tag={e.tag} sway={sw} />;
    }
    case "box":
      return <BoxBack x={e.x} y={e.y} w={e.w} />;
    case "book": {
      const turn = has(e, "page-turn") ? prog(animT(e, "page-turn", tm), fps * 0.35, fps * 1.25, easeInOut) : 0;
      return <BookCloseUp x={e.x} y={e.y} w={e.w} turn={turn} />;
    }
    case "bird": {
      const st = animT(e, "land", tm);
      const p = prog(st, fps * 0.3, fps * 0.3 + 14, (x) => x);
      const fall = p < 1 ? -30 * (1 - ease(p)) - 40 * (1 - p) : 0;
      const bounce = p >= 1 ? -Math.abs(Math.sin((st - fps * 0.3 - 14) / 2.2)) * 5 * Math.exp(-(st - fps * 0.3 - 14) / 6) : 0;
      const dx = p < 1 ? 70 * (1 - ease(p)) : 0;
      return <g opacity={clamp01(st / 4)}><Bird x={e.x + dx} y={e.y + fall + bounce} /></g>;
    }
    case "door":
      return <Door x={e.x} y={e.y} h={e.h} />;
    case "mat":
      return <Mat x={e.x} y={e.y} w={e.w} />;
    case "doc-mini":
      return <DocMini x={e.x} y={e.y} w={e.w} />;
    case "room-iso":
      return <RoomIso x={e.x} y={e.y} w={e.w} t={tm.t} fps={fps} />;
    case "cat":
      return <CatView e={e} tm={tm} ctx={ctx} />;
    case "person":
      return <PersonView e={e} tm={tm} ctx={ctx} slip={slip} />;
    case "inspector":
      return <InspectorView e={e} tm={tm} ctx={ctx} />;
    case "crowd": {
      const n = e.n ?? 5;
      const s = (e.h ?? 300) / 100;
      return (
        <g filter="url(#glowSoft)">
          {Array.from({ length: n }, (_, i) => {
            const x = e.x + (i - (n - 1) / 2) * (e.spacing ?? 230);
            const turnP = prog(tm.t, 4 + i * 3, 22 + i * 3, easeInOut);
            const pose = { ...POSES["stand-side"], head: { ...POSES["stand-side"].head, x: lerp(0, 2, turnP), w: lerp(20, 17, turnP) } };
            return (
              <g key={i} transform={`translate(${x} ${e.y}) scale(${s})`}>
                <PersonBody pose={pose} color={e.color === "dim" ? "#7D8794" : C.fg} />
              </g>
            );
          })}
        </g>
      );
    }
    case "gaze": {
      const from = resolvePt(e.from, ctx);
      let to = resolvePt(e.to, ctx);
      if (e.blocked_by === "person" && ctx.persons[0]) {
        const pr = ctx.persons[0];
        const stopX = pr.x - pr.h * 0.15 * Math.sign(to.x - from.x);
        const f = (stopX - from.x) / (to.x - from.x);
        to = { x: stopX, y: from.y + (to.y - from.y) * f };
      }
      const p = has(e, "draw-on") ? prog(animT(e, "draw-on", tm) - delay, 2, 24, (x) => x) : 1;
      const color = e.color === "dim" ? C.dim : e.color === "fg" ? C.fg : C.dim;
      return <Gaze from={from} to={to} p={p} color={color} opacity={e.color === "fg" ? 0.9 : 0.85} />;
    }
    case "mark": {
      const color = e.color === "red" ? C.red : C.blue;
      if (has(e, "pop-in")) {
        const pi = popIn(t, 0);
        return <MarkShape type={e.type} x={e.x} y={e.y} size={e.size} color={color} p={prog(t, 0, 10)} scale={pi.scale} opacity={pi.opacity} />;
      }
      const p = has(e, "draw-on") ? prog(t, 0, e.type === "cross" ? DRAW * 1.4 : DRAW, (x) => x) : 1;
      return <MarkShape type={e.type} x={e.x} y={e.y} size={e.size} color={color} p={p} />;
    }
    case "eye":
      return <EyeIcon x={e.x} y={e.y} w={e.w} />;
    case "label": {
      const target = resolvePt(e.target, ctx);
      const left = e.target === "cat.tail" || e.target === "cat.haunch";
      const up = e.target === "cat.ears" ? -70 : e.target === "cat.paws" ? -150 : e.target === "cat.tail" ? -150 : -120;
      const dx = left ? -230 : 230;
      const p = has(e, "draw-on") ? prog(t, 0, 26, (x) => x) : 1;
      return <Label target={target} text={e.text} color={e.color === "red" ? C.red : C.blue} p={p} dx={dx} dy={up} align={left ? "end" : "start"} />;
    }
    case "speech":
    case "thought": {
      const from = e.from ? resolvePt(e.from, ctx) : undefined;
      const pi = popIn(t, 0);
      const fade = has(e, "fade-out") ? 1 - prog(t, tm.dur * 0.25, tm.dur * 0.85) : 1;
      return <Bubble x={e.x} y={e.y} text={e.text ?? ""} from={from} small={e.size === "small"} outlineOnly={e.outline_only} thought={e.el === "thought"} opacity={pi.opacity * fade} scale={pi.scale} />;
    }
    case "boundary": {
      const p = has(e, "draw-on") ? prog(animT(e, "draw-on", tm), 4, 4 + 24, easeInOut) : 1;
      const pts = e.pts ?? [{ x: e.x1, y: e.y1 }, { x: e.x2, y: e.y2 }];
      return <Boundary pts={pts} p={p} color={e.color === "red" ? C.red : C.blue} />;
    }
    case "glow":
      return <GlowEl x={e.x} y={e.y} r={e.r} color={e.color === "blue" ? C.blue : C.fg} opacity={e.opacity ?? 0.2} />;
    case "checklist": {
      const tp = has(e, "tick") ? prog(animT(e, "tick", tm), fps * 0.45, fps * 0.45 + 10, (x) => x) : 0;
      return <Checklist x={e.x} y={e.y} w={e.w ?? 300} items={e.items} tick={e.tick} tickP={tp} big={!!e.w && e.w > 500} />;
    }
    case "counter": {
      const p = prog(tm.t, 0, tm.dur * 0.7, ease);
      const v = lerp(e.from ?? 0, e.value, p);
      return (
        <g opacity={popIn(tm.t).opacity}>
          <CounterNumber x={e.x} y={e.y} value={v} size={140} suffix={e.suffix} label={e.label} />
        </g>
      );
    }
    default: {
      // Episode-specific element kinds (src/episodes/<slug>/assets.tsx).
      const Custom = assets.elements?.[e.el];
      return Custom ? (
        <g opacity={baseOpacity}>
          <Custom e={e} t={t} dur={tm.dur} fps={fps} />
        </g>
      ) : null;
    }
  }
};

const CatView: React.FC<{ e: El; tm: Tm; ctx: Ctx }> = ({ e, tm, ctx }) => {
  const { fps } = ctx;
  const old = e.age === "old";
  // h is the height of the pose as drawn: sitting cats are ~100 units tall, a
  // curled sleeper ~30 and a loaf ~50.
  const unitH = e.pose === "sleep" ? 30 : e.pose === "loaf" ? 50 : 100;
  const s = ((e.h ?? 150) / unitH) * (old ? 0.92 : 1);
  const dir = e.facing === "left" ? -1 : 1;
  if (e.pose === "face-close") {
    const ht = animArg(e, "head-turn");
    const yaw = ht ? lerp(68, 0, prog(animT(e, "head-turn", tm), fps * 0.15, tm.dur * 0.95, easeInOut)) : 0;
    const pupil = has(e, "pupils-dilate") ? lerp(0.22, 0.78, prog(animT(e, "pupils-dilate", tm), 0, tm.dur, (x) => x)) : 0.42;
    return (
      <g transform={`translate(${e.x} ${e.y}) scale(${e.h / 100})`} filter="url(#glow)">
        <CatFace yaw={yaw} pupil={pupil} />
      </g>
    );
  }
  let x = e.x;
  let step = 0;
  const walk = animArg(e, "walk");
  if (walk) {
    const stopAt = walk.stop_at ?? 1;
    const p = clamp01(tm.t / Math.max(1, tm.dur * stopAt));
    x = lerp(walk.fromX, walk.toX, 1 - (1 - p) * (1 - p) * 0.25 - (1 - p) * 0.75);
    step = p < 1 ? Math.floor(tm.t / 6) % 2 : 1;
  }
  let yaw = 72;
  const ht = animArg(e, "head-turn");
  if (e.pose === "head-turn" && ht) {
    const st = animT(e, "head-turn", tm);
    const a = prog(st, fps * 0.15, fps * 0.15 + 16, easeInOut);
    const b = ht.back ? prog(st, tm.dur * 0.62, tm.dur * 0.62 + 18, easeInOut) : 0;
    yaw = lerp(72, -58, a - b);
  }
  let eyeOpen = 1;
  if (e.eyes === "squint") eyeOpen = 0.3;
  if (e.eyes === "heavy") eyeOpen = 0.42 - 0.12 * prog(tm.t, 0, tm.dur, (x) => x);
  if (e.eyes === "closing" || has(e, "slow-blink")) {
    const ph = tm.t / tm.dur;
    eyeOpen = ph < 0.25 ? lerp(1, 0.25, ease(ph / 0.25)) : ph < 0.45 ? lerp(0.25, 0.9, ease((ph - 0.25) / 0.2)) : lerp(0.9, 0.12, ease(clamp01((ph - 0.5) / 0.4)));
  }
  if (e.pose === "sit-front" && !e.eyes) {
    const blinkAt = Math.round(tm.dur * 0.55);
    const d = Math.abs(tm.t - blinkAt);
    eyeOpen = d < 3 ? [0.05, 0.4, 0.8][d] : 1;
  }
  let headDip = 0;
  if (has(e, "head-dip")) {
    const ph = tm.t / tm.dur;
    headDip = ph < 0.62 ? easeInOut(ph / 0.62) : ph < 0.68 ? lerp(1, 0, (ph - 0.62) / 0.06) : easeInOut((ph - 0.68) / 0.32) * 0.7;
  }
  const breathe = has(e, "breathe") ? 0.5 - 0.5 * Math.cos(((animT(e, "breathe", tm) / fps) * 2 * Math.PI) / 2.5) : 0;
  const inBox = e.inside === "box";
  const color = e.color === "grey" ? C.grey : e.color === "dim" ? C.dim : C.fg;
  return (
    <g transform={`translate(${x} ${e.y}) scale(${s * dir} ${s})`} filter="url(#glow)" opacity={e.opacity ?? 1}>
      {inBox && <clipPath id="boxclip"><rect x={-200} y={-200} width={400} height={200 + 4} /></clipPath>}
      <Cat pose={e.pose} yaw={yaw} eyes={e.eyes} eyeOpen={eyeOpen} earsBack={e.ears === "back" ? 1 : 0} old={old} step={step} breathe={breathe} headDip={headDip} color={color} t={tm.t} fps={fps} />
    </g>
  );
};

const PersonView: React.FC<{ e: El; tm: Tm; ctx: Ctx; slip?: boolean }> = ({ e, tm, ctx }) => {
  const { fps } = ctx;
  const s = (e.h ?? 300) / 100;
  const dir = e.facing === "left" ? -1 : 1;
  const color = e.color === "grey" ? C.grey : e.color === "dim" ? C.dim : C.fg;
  if (e.pose === "lie-bed") {
    return (
      <g transform={`translate(${e.x} ${e.y})`} filter="url(#glowSoft)">
        <PersonInBed w={(e.h ?? 120) * 4} color={color} />
      </g>
    );
  }
  let y = e.y;
  let x = e.x;
  if (isSeated(e.pose) && ctx.seats[0]) y = ctx.seats[0].y;
  if (e.followSlide) {
    const bc = ctx.els.find((b) => b.el === "bookcase");
    const sl = bc && animArg(bc, "slide");
    if (sl) {
      const o = slideOffset(sl, tm.t, tm.dur, fps);
      x += o.dx + o.sh;
    }
  }
  const pose = personPose(e, tm.t, tm, fps);
  // Barely-there idle: a slow 1 px breath on standing/sitting figures.
  const idle = Math.sin((tm.t / fps) * 1.6 + e.x) * 0.25;
  const body = (filter: string, op = 1) => (
    <g transform={`translate(${x} ${y}) scale(${s * dir} ${s})`} filter={filter} opacity={op}>
      <g transform={`translate(0 ${idle})`}>
        <PersonBody pose={pose} color={color} />
      </g>
    </g>
  );
  if (e.outline === "red") {
    const pulse = has(e, "pulse-outline") ? 0.55 + 0.45 * (0.5 + 0.5 * Math.sin((tm.t / fps) * Math.PI * 2 * 0.9)) : 1;
    return (
      <g>
        {body("url(#outlineRed)", pulse)}
        {body("url(#glow)")}
      </g>
    );
  }
  return body("url(#glow)");
};

const InspectorView: React.FC<{ e: El; tm: Tm; ctx: Ctx }> = ({ e, tm }) => {
  const s = (e.h ?? 520) / 100;
  const op = e.opacity ?? 1;
  const jitter = has(e, "carbon-jitter");
  const on = jitter && [0, 1, 4, 5, 9, 13, 14, 18, 22, 23].includes(tm.t % 26);
  const body = (color: string, dx = 0, dy = 0, o = 1) => (
    <g transform={`translate(${e.x + dx} ${e.y + dy}) scale(${s})`} opacity={o}>
      <InspectorBody pose={e.pose} color={color} />
    </g>
  );
  return (
    <g opacity={op}>
      {jitter && on && <g style={{ mixBlendMode: "screen" }}>{body(C.blue, 4 * (s / 5.2) + 2, -2, 0.5)}</g>}
      {body(C.grey)}
      {jitter && on && <rect x={e.x - 50 * s * 0.4} y={e.y - s * 60 + (tm.t % 7) * 6} width={s * 40} height={2} fill={C.blue} opacity={0.5} />}
    </g>
  );
};

export const Tableau: React.FC<{ subs: SubShot[]; frame: number; fps: number; foreground?: boolean }> = ({ subs, frame, fps }) => {
  let k = 0;
  for (let i = 0; i < subs.length; i++) if (frame >= subs[i].localStart) k = i;
  const cur = subs[k];
  const els = (cur.shot.elements ?? []) as El[];
  const anchors = computeAnchors(els);
  const persons = els.filter((e) => e.el === "person").map((e) => ({ x: e.x, y: e.y, h: e.h ?? 300 }));
  const seats = els
    .filter((e) => e.el === "sofa" || e.el === "armchair")
    .map((e) => ({ x: e.x, w: e.w, y: e.el === "sofa" ? sofaSeatY(e.y, e.w, e.close) : armchairSeatY(e.y, e.w) }));
  const ctx: Ctx = { fps, els, anchors, persons, seats };
  const timeOf = (e: El): Tm => {
    const key = elKey(e);
    let j = k;
    while (j > 0 && (subs[j - 1].shot.elements ?? []).some((x: El) => elKey(x) === key)) j--;
    const prevVersion = k > 0 ? (subs[k - 1].shot.elements ?? []).find((x: El) => elKey(x) === key) : undefined;
    const prevAnims = new Set(prevVersion ? animsOf(prevVersion).map(animName) : []);
    const newAnims = new Set(j < k ? animsOf(e).map(animName).filter((a) => !prevAnims.has(a)) : []);
    return { t: frame - subs[j].localStart, sub: frame - cur.localStart, dur: subs[j].localEnd - subs[j].localStart, subDur: cur.localEnd - cur.localStart, newAnims };
  };
  // Draw order: things behind furniture first (inspector leaning over a sofa back,
  // cat inside a box is followed by the box front).
  const order = els.map((e, i) => ({ e, i })).sort((a, b) => z(a.e) - z(b.e) || a.i - b.i);
  return (
    <g>
      {order.map(({ e, i }) => (
        <React.Fragment key={`${i}-${elKey(e)}`}>
          <ElementView e={e} tm={timeOf(e)} ctx={ctx} frame={frame} idx={i} slip={cur.shot.style === "slip"} />
          {e.el === "cat" && e.inside === "box" && (() => {
            const box = els.find((b) => b.el === "box");
            return box ? <BoxFront x={box.x} y={box.y} w={box.w} /> : null;
          })()}
          {e.el === "cat" && (e.pose === "sleep") && (() => {
            const bed = els.find((b) => b.el === "cat-bed" && Math.abs(b.x - e.x) < 60);
            return bed ? <CatBedFront x={bed.x} y={bed.y} w={bed.w} tag={bed.tag} sway={has(bed, "tag-sway") ? 9 * Math.sin(timeOf(bed).sub / 4.2) * Math.exp(-timeOf(bed).sub / 30) * clamp01(timeOf(bed).sub / 3) : 0} /> : null;
          })()}
        </React.Fragment>
      ))}
    </g>
  );
};

function z(e: El) {
  // Explicit draw layer (mainly for episode-specific elements): higher draws on top.
  if (typeof e.z === "number") return e.z;
  if (e.el === "glow") return -3;
  if (e.el === "window" || e.el === "corner") return -2;
  if (e.el === "inspector" && e.pose === "lean-over") return -1;
  if (e.el === "gaze") return -0.4;
  if (e.el === "boundary") return -0.3;
  if ((e.el === "sofa" && e.view !== "back") || e.el === "armchair" || e.el === "bed" || e.el === "cat-bed" || e.el === "box" || e.el === "bookcase") return -0.5;
  if (e.el === "mark" || e.el === "label" || e.el === "speech" || e.el === "thought") return 3;
  if (e.el === "sofa" && e.view === "back") return 4;
  if (e.el === "clock" || e.el === "checklist" || e.el === "counter") return 1;
  return 0;
}

export { rand };
