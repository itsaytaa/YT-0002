// Case file, floor plan, counter, calendar and seal shots.
import React from "react";
import { C, FONT, DISPLAY_STYLE } from "../theme";
import { clamp01, ease, easeInOut, lerp, popIn, prog, rand } from "../anim";
import { Stamp } from "./Stamp";
import { CounterNumber, Gaze } from "../figures/Marks";

// ---------------------------------------------------------------- case file
export const CaseFile: React.FC<{ shot: any; frame: number }> = ({ shot, frame }) => {
  const p = prog(frame, 0, 14);
  const dx = lerp(1100, 0, p);
  const cx = 960, cy = 480, w = 980, h = 640;
  const l = cx - w / 2, t = cy - h / 2;
  return (
    <g transform={`translate(${dx} 0) rotate(${lerp(4, -1.5, p)} ${cx} ${cy})`}>
      <rect x={l + 12} y={t + 18} width={w} height={h} fill="#000" opacity={0.5} filter="url(#soft)" />
      <path d={`M${l} ${t + 30} L ${l} ${t + h} L ${l + w} ${t + h} L ${l + w} ${t + 30} L ${l + 380} ${t + 30} L ${l + 350} ${t - 20} L ${l + 30} ${t - 20} L ${l + 10} ${t + 30} Z`} fill="#BFAE82" stroke="#8F7F58" strokeWidth={2} />
      <rect x={l + 20} y={t + 6} width={w - 40} height={60} fill={C.paper} opacity={0.9} />
      <rect x={l} y={t + 46} width={w} height={h - 46} fill={C.manila} stroke="#9C8B60" strokeWidth={2} />
      <text x={l + 60} y={t + 18} fontFamily={FONT.mono} fontWeight={600} fontSize={22} letterSpacing="0.26em" fill="#5C4F33">
        {shot.label ?? "CASE FILE"}
      </text>
      {/* label sticker */}
      <g transform={`rotate(-1.5 ${l + 330} ${t + 260})`}>
        <rect x={l + 90} y={t + 150} width={500} height={220} fill={C.paper} stroke="#B5AD9A" strokeWidth={1.5} />
        <path d={`M${l + 110} ${t + 300} H ${l + 570}`} stroke={C.ink} strokeWidth={1.2} opacity={0.35} />
        <text x={l + 120} y={t + 250} fontFamily={FONT.mono} fontWeight={600} fontSize={64} letterSpacing="0.06em" fill={C.ink}>
          CASE {shot.number}
        </text>
        <text x={l + 120} y={t + 340} fontFamily={FONT.mono} fontWeight={400} fontSize={36} letterSpacing="0.1em" fill={C.ink}>
          {shot.location}
        </text>
      </g>
      <text x={l + 90} y={t + h - 50} fontFamily={FONT.mono} fontSize={18} letterSpacing="0.2em" fill="#5C4F33" opacity={0.8}>
        DEPT. OF UNLISTED RISKS · RETAIN INDEFINITELY
      </text>
      {/* paper clip */}
      <path d={`M${l + 760} ${t - 40} L ${l + 760} ${t + 110} Q ${l + 760} ${t + 130} ${l + 780} ${t + 130} Q ${l + 800} ${t + 130} ${l + 800} ${t + 110} L ${l + 800} ${t - 20} Q ${l + 800} ${t - 34} ${l + 788} ${t - 34} Q ${l + 776} ${t - 34} ${l + 776} ${t - 20} L ${l + 776} ${t + 92}`} stroke="#A9B0B8" strokeWidth={6} fill="none" strokeLinecap="round" />
      <Stamp id="unlisted" x={l + w - 210} y={t + h - 150} text="UNLISTED" size={64} rot={-8} opacity={0.85} seed={5} />
    </g>
  );
};

// ---------------------------------------------------------------- floor plan
const ROOMS: Record<string, { x: number; y: number; w: number; h: number; label: string }> = {
  living: { x: 380, y: 200, w: 520, h: 580, label: "LIVING" },
  hall: { x: 900, y: 200, w: 160, h: 580, label: "HALL" },
  kitchen: { x: 1060, y: 200, w: 300, h: 260, label: "KITCHEN" },
  bath: { x: 1360, y: 200, w: 180, h: 260, label: "BATH" },
  bedroom: { x: 1060, y: 460, w: 480, h: 320, label: "BEDROOM" },
};
const LAMPS: Array<{ room: string; x: number; y: number }> = [
  { room: "living", x: 460, y: 280 },
  { room: "hall", x: 980, y: 330 },
  { room: "kitchen", x: 1210, y: 330 },
  { room: "bath", x: 1450, y: 330 },
  { room: "bedroom", x: 1300, y: 620 },
];
const POS = {
  catCorner: { x: 862, y: 300 },
  person: { x: 640, y: 520 },
  catHall: { x: 980, y: 560 },
  cornerLiving: { x: 878, y: 222 },
  bookcaseLiving: { x: 800, y: 222 },
};
const CAT_PATH = [POS.catCorner, { x: 862, y: 600 }, { x: 980, y: 600 }, POS.catHall];
const CORNER_PATH = [POS.cornerLiving, { x: 860, y: 600 }, { x: 980, y: 600 }, { x: 980, y: 640 }, { x: 1300, y: 640 }, { x: 1518, y: 758 }];

export const LAMP_START_SEC = 0.3;
export const LAMP_GAP_SEC = 0.25;
// Frames (relative to line start) at which lamps click on/off, for the sfx track.
export const lampClickFrames = (fps: number) => LAMPS.map((_, i) => Math.round((LAMP_START_SEC + i * LAMP_GAP_SEC) * fps));

function along(path: { x: number; y: number }[], t: number) {
  const segs = path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.y - path[i].y));
  const total = segs.reduce((a, b) => a + b, 0);
  let d = t * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i]) {
      const f = segs[i] ? d / segs[i] : 0;
      return { x: lerp(path[i].x, path[i + 1].x, f), y: lerp(path[i].y, path[i + 1].y, f) };
    }
    d -= segs[i];
  }
  return path[path.length - 1];
}

const Wall: React.FC<{ d: string }> = ({ d }) => <path d={d} stroke={C.fg} strokeWidth={4} fill="none" strokeLinecap="square" opacity={0.9} />;

export const Floorplan: React.FC<{ plan: any; frame: number; fps: number; dur: number }> = ({ plan, frame, fps }) => {
  const lampOn = LAMPS.map((_, i) => {
    const at = (LAMP_START_SEC + i * LAMP_GAP_SEC) * fps;
    if (plan.anim === "lamps-on-sequence") return prog(frame, at, at + 4, (x) => x);
    if (plan.anim === "lamps-off-sequence") {
      const atOff = (LAMP_START_SEC + i * LAMP_GAP_SEC) * fps; // order reversed below
      return 1 - prog(frame, atOff, atOff + 3, (x) => x);
    }
    return plan.startLit ? 1 : 0;
  });
  const lampState = plan.anim === "lamps-off-sequence" ? [...lampOn].reverse() : lampOn;
  const markers: any[] = plan.markers ?? [];
  const hasCat = markers.some((m) => m.kind === "cat");
  let catPos = plan.catIn === "hall" ? POS.catHall : POS.catCorner;
  if (plan.anim === "marker-move" && plan.move?.marker === "cat") catPos = along(CAT_PATH, prog(frame, fps * 0.3, fps * 1.5, easeInOut));
  let cornerPos = POS.cornerLiving;
  let bookPos = POS.bookcaseLiving;
  if (plan.anim === "marker-move" && plan.move?.marker === "corner") {
    const p = prog(frame, fps * 0.45, fps * 2.05, easeInOut);
    cornerPos = along(CORNER_PATH, p);
    bookPos = { x: cornerPos.x - 78, y: cornerPos.y };
  }
  const gazeP = plan.gaze ? prog(frame, 6, 26, (x) => x) : 0;
  return (
    <g>
      <rect x={340} y={160} width={1240} height={660} fill="none" stroke={C.line} strokeWidth={1} strokeDasharray="4 10" opacity={0.5} />
      {Object.entries(ROOMS).map(([k, r]) => {
        const i = LAMPS.findIndex((l) => l.room === k);
        const on = lampState[i] ?? 0;
        const L = LAMPS[i];
        return (
          <g key={k}>
            <clipPath id={`room${k}`}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} />
            </clipPath>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={C.surface} opacity={0.6} />
            {on > 0 && (
              <g clipPath={`url(#room${k})`} opacity={on}>
                <defs>
                  <radialGradient id={`lg${k}`} cx={L.x} cy={L.y} r={360} gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#FFF6E6" stopOpacity={0.5} />
                    <stop offset="0.5" stopColor="#FFF6E6" stopOpacity={0.16} />
                    <stop offset="1" stopColor="#FFF6E6" stopOpacity={0.03} />
                  </radialGradient>
                </defs>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={`url(#lg${k})`} />
              </g>
            )}
            <text x={r.x + 18} y={r.y + r.h - 18} fontFamily={FONT.mono} fontWeight={500} fontSize={20} letterSpacing="0.2em" fill={C.dim}>
              {r.label}
            </text>
          </g>
        );
      })}
      {/* furniture hints */}
      <g stroke={C.line} strokeWidth={2} fill="none" opacity={0.85}>
        <rect x={420} y={600} width={260} height={90} rx={14} />
        <rect x={700} y={640} width={90} height={60} rx={8} />
        <rect x={1080} y={220} width={260} height={50} />
        <circle cx={1300} cy={380} r={22} />
        <rect x={1380} y={220} width={140} height={70} rx={30} />
        <rect x={1360 + 20} y={380} width={50} height={60} rx={20} />
        <rect x={1320} y={560} width={200} height={190} rx={8} />
        <rect x={1330} y={570} width={180} height={40} rx={8} />
      </g>
      {/* walls with door gaps */}
      <Wall d="M380 200 H 1540 V 780 H 380 Z" />
      <Wall d="M900 200 V 560 M900 640 V 780" />
      <Wall d="M1060 200 V 290 M1060 370 V 600 M1060 680 V 780" />
      <Wall d="M1360 200 V 460" />
      <Wall d="M1060 460 H 1420 M1490 460 H 1540" />
      <path d="M940 780 H 1020" stroke={C.bg} strokeWidth={8} />
      <path d="M940 780 A 80 80 0 0 1 1020 700" stroke={C.dim} strokeWidth={2} fill="none" strokeDasharray="5 6" />
      {/* lamps */}
      {LAMPS.map((L, i) => (
        <g key={i}>
          <circle cx={L.x} cy={L.y} r={14} fill={lampState[i] > 0.5 ? "#FFF6E6" : C.bg} stroke={C.fg} strokeWidth={2.5} filter={lampState[i] > 0.5 ? "url(#glow)" : undefined} />
          <path d={`M${L.x - 6} ${L.y} H ${L.x + 6} M${L.x} ${L.y - 6} V ${L.y + 6}`} stroke={lampState[i] > 0.5 ? C.bg : C.fg} strokeWidth={1.5} opacity={0.6} />
        </g>
      ))}
      {/* markers */}
      {markers.some((m) => m.kind === "bookcase") && <rect x={bookPos.x - 34} y={bookPos.y - 12} width={68} height={24} fill={C.surface2} stroke={C.fg} strokeWidth={2.5} />}
      {markers.some((m) => m.kind === "corner") && (
        <path d={`M${cornerPos.x + 16} ${cornerPos.y - 16} L ${cornerPos.x - 30} ${cornerPos.y - 16} L ${cornerPos.x + 16} ${cornerPos.y + 30} Z`} fill={C.blue} filter="url(#glowBlue)" />
      )}
      {markers.some((m) => m.kind === "person") && <rect x={POS.person.x - 18} y={POS.person.y - 18} width={36} height={36} rx={10} fill={C.fg} filter="url(#glow)" />}
      {hasCat && (
        <g transform={`translate(${catPos.x} ${catPos.y})`} filter="url(#glow)">
          <circle r={15} fill={C.fg} />
          <path d="M-13 -6 L -10 -24 L -1 -13 Z M13 -6 L 10 -24 L 1 -13 Z" fill={C.fg} />
        </g>
      )}
      {plan.gaze && <Gaze from={{ x: POS.catHall.x - 20, y: POS.catHall.y - 6 }} to={{ x: POS.person.x - 40, y: POS.person.y - 46 }} p={gazeP} color={C.fg} size={5} gap={11} />}
      {plan.gaze && (
        <circle cx={POS.person.x - 40} cy={POS.person.y - 46} r={14} fill="none" stroke={C.red} strokeWidth={3} opacity={prog(frame, 26, 32)} filter="url(#glowRed)" />
      )}
      <text x={1540} y={150} textAnchor="end" fontFamily={FONT.mono} fontWeight={500} fontSize={18} letterSpacing="0.2em" fill={C.dim}>
        {plan.caption ?? "PLAN · RESIDENCE"}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------- counter
// Optional backdrop (`decor`): "folder-stack" (folders pile up beside the number),
// "redacted-list" (a list of redacted rows scrolls behind it, a red pin drops on it),
// "dots-grid" (one dot per unit fills in). `x` moves the number off-centre.
export const CounterShot: React.FC<{ shot: any; frame: number; fps: number; dur: number }> = ({ shot, frame, fps, dur }) => {
  const p = prog(frame, 0, dur * 0.7, ease);
  const value = lerp(shot.from ?? 0, shot.value, p);
  const appear = popIn(frame);
  const red = shot.accent === "red";
  const decor = shot.decor as string | undefined;
  const cx = shot.x ?? 960;
  return (
    <g>
      {decor === "redacted-list" && <ScrollingList frame={frame} />}
      {decor === "dots-grid" && <EveningDots value={value} total={shot.value} />}
      {decor === "dots-grid" && <ellipse cx={960} cy={500} rx={420} ry={190} fill={C.bg} opacity={0.75} filter="url(#bloom)" />}
      {decor === "folder-stack" && <FolderStack n={Math.round(lerp(0, shot.decorCount ?? 11, p))} frame={frame} />}
      <g opacity={appear.opacity} transform={`translate(${cx} 470) scale(${appear.scale}) translate(${-cx} -470)`}>
        <CounterNumber x={cx} y={560} value={value} size={240} label={shot.label} labelColor={red ? C.red : C.dim} />
      </g>
      {decor === "redacted-list" && <Pin x={cx + 330} y={340} frame={frame - fps * 0.6} />}
    </g>
  );
};

const FolderStack: React.FC<{ n: number; frame: number }> = ({ n }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const y = 720 - i * 30;
      const x = 1480 + (rand(i * 3.3) - 0.5) * 30;
      const r = (rand(i * 7.1) - 0.5) * 6;
      return (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <path d={`M${x - 150} ${y} L ${x - 150} ${y - 26} L ${x - 60} ${y - 26} L ${x - 50} ${y - 34} L ${x + 150} ${y - 34} L ${x + 150} ${y} Z`} fill={i % 2 ? "#B9A97F" : C.manila} stroke="#7E7050" strokeWidth={1.5} />
          <rect x={x - 120} y={y - 22} width={60} height={9} fill={C.paper} opacity={0.8} />
        </g>
      );
    })}
  </g>
);

const ScrollingList: React.FC<{ frame: number }> = ({ frame }) => {
  const off = (frame * 1.6) % 54;
  return (
    <g opacity={0.07}>
      <rect x={560} y={130} width={800} height={720} fill={C.paper} />
      <clipPath id="listclip">
        <rect x={560} y={130} width={800} height={720} />
      </clipPath>
      <g clipPath="url(#listclip)">
        {Array.from({ length: 18 }, (_, i) => {
          const y = 170 + i * 54 - off;
          const k = Math.floor((frame * 1.6) / 54) + i;
          return (
            <g key={i}>
              <text x={600} y={y + 14} fontFamily={FONT.mono} fontSize={22} fill={C.ink}>
                {String(2299 + k).padStart(4, "0")}
              </text>
              <rect x={700} y={y - 4} width={300 + rand(k) * 260} height={22} fill={C.redaction} />
            </g>
          );
        })}
      </g>
    </g>
  );
};

const Pin: React.FC<{ x: number; y: number; frame: number }> = ({ x, y, frame }) => {
  if (frame < 0) return null;
  const p = prog(frame, 0, 10, (t) => t * t);
  const bounce = frame > 10 ? -Math.abs(Math.sin((frame - 10) / 2.5)) * 10 * Math.exp(-(frame - 10) / 6) : 0;
  const yy = lerp(y - 260, y, p) + bounce;
  return (
    <g opacity={clamp01(frame / 3)} filter="url(#glowRed)">
      <path d={`M${x} ${yy + 10} L ${x - 6} ${yy + 80}`} stroke={C.dim} strokeWidth={5} strokeLinecap="round" />
      <circle cx={x} cy={yy} r={30} fill={C.red} />
      <circle cx={x - 9} cy={yy - 9} r={8} fill="#F07A71" />
    </g>
  );
};

const EveningDots: React.FC<{ value: number; total: number }> = ({ value, total }) => {
  const cols = 73;
  const rows = Math.ceil(total / cols);
  const gx = 1500 / cols, gy = 560 / rows;
  const n = Math.round(value);
  const dots = [];
  for (let i = 0; i < total; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    dots.push(<rect key={i} x={210 + c * gx} y={190 + r * gy} width={4} height={4} fill={i < n ? C.blue : C.line} opacity={i < n ? 0.35 : 0.18} />);
  }
  return <g>{dots}</g>;
};

// ---------------------------------------------------------------- calendar
// Pages flip from `fromYear` to `toYear` (default: the last `value` years up to 2026);
// `pageLabel` is the red header on each page.
export const Calendar: React.FC<{ shot: any; frame: number; dur: number }> = ({ shot, frame, dur }) => {
  const toYear = shot.toYear ?? 2026;
  const fromYear = shot.fromYear ?? toYear - (shot.value ?? 11);
  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i);
  const p = prog(frame, 6, dur * 0.7, (x) => x);
  const idx = Math.min(years.length - 1, Math.floor(p * years.length));
  const flipT = (p * years.length) % 1;
  const cx = 700, cy = 480;
  const page = (year: number, extra?: string) => (
    <g>
      <rect x={cx - 170} y={cy - 170} width={340} height={340} fill={C.paper} />
      <rect x={cx - 170} y={cy - 170} width={340} height={78} fill={C.red} opacity={0.9} />
      <text x={cx} y={cy - 116} textAnchor="middle" fontFamily={FONT.mono} fontWeight={600} fontSize={26} letterSpacing="0.3em" fill={C.paper}>
        {extra ?? shot.pageLabel ?? "DAY"}
      </text>
      <text x={cx} y={cy + 70} textAnchor="middle" style={DISPLAY_STYLE} fontSize={130} fill={C.ink}>
        {year}
      </text>
      <text x={cx} y={cy + 132} textAnchor="middle" fontFamily={FONT.mono} fontSize={22} letterSpacing="0.2em" fill={C.ink} opacity={0.6}>
        365 OF 365
      </text>
    </g>
  );
  const done = p >= 1;
  return (
    <g>
      <rect x={cx - 186} y={cy - 156} width={372} height={346} fill="#000" opacity={0.4} filter="url(#soft)" />
      {page(years[Math.min(years.length - 1, done ? idx : idx + (flipT > 0.02 ? 1 : 0))])}
      {!done && idx < years.length - 1 && flipT > 0.02 && (
        <g transform={`translate(0 ${cy - 170}) scale(1 ${Math.max(0.001, Math.cos((flipT * Math.PI) / 2))}) translate(0 ${-(cy - 170)})`}>
          {page(years[idx])}
          <rect x={cx - 170} y={cy - 170} width={340} height={340} fill="#000" opacity={0.45 * flipT} />
        </g>
      )}
      <rect x={cx - 186} y={cy - 196} width={372} height={40} rx={6} fill="#2A2F37" stroke={C.line} strokeWidth={2} />
      {[-120, -40, 40, 120].map((d) => (
        <circle key={d} cx={cx + d} cy={cy - 176} r={8} fill={C.bg} />
      ))}
      <CounterNumber x={1260} y={560} value={Math.round(lerp(0, shot.value ?? 11, p))} size={240} label={shot.label ?? "YEARS"} />
    </g>
  );
};

// ---------------------------------------------------------------- seal
export const Seal: React.FC<{ frame: number; fps: number }> = ({ frame }) => {
  const cx = 960, cy = 450;
  const fade = prog(frame, 0, 24);
  const rot = lerp(-20, 0, prog(frame, 0, 40, easeInOut));
  const r1 = 240, r2 = 182, rt = 206;
  const eyeOpen = prog(frame, 18, 34, easeInOut);
  return (
    <g opacity={fade}>
      <defs>
        <path id="ringpath" d={`M ${cx} ${cy} m -${rt} 0 a ${rt} ${rt} 0 1 1 ${rt * 2} 0 a ${rt} ${rt} 0 1 1 -${rt * 2} 0`} />
      </defs>
      <circle cx={cx} cy={cy} r={r1} fill="none" stroke={C.fg} strokeWidth={5} filter="url(#glowSoft)" />
      <circle cx={cx} cy={cy} r={r1 - 12} fill="none" stroke={C.fg} strokeWidth={1.5} opacity={0.7} />
      <circle cx={cx} cy={cy} r={r2} fill="none" stroke={C.fg} strokeWidth={3} />
      <g transform={`rotate(${rot} ${cx} ${cy})`}>
        <text fontFamily={FONT.mono} fontWeight={600} fontSize={29} letterSpacing="0.3em" fill={C.fg}>
          <textPath href="#ringpath" startOffset="0%" textLength={2 * Math.PI * rt * 0.97} lengthAdjust="spacing">
            DEPARTMENT OF UNLISTED RISKS ✦ DEPARTMENT OF UNLISTED RISKS ✦
          </textPath>
        </text>
      </g>
      {/* house with a single open eye */}
      <path d={`M${cx - 92} ${cy + 86} V ${cy - 10} L ${cx} ${cy - 96} L ${cx + 92} ${cy - 10} V ${cy + 86} Z`} fill="none" stroke={C.fg} strokeWidth={8} strokeLinejoin="round" filter="url(#glowSoft)" />
      <g transform={`translate(${cx} ${cy + 22}) scale(1 ${Math.max(0.05, eyeOpen)})`} filter="url(#glowBlue)">
        <path d="M-62 0 Q 0 -54 62 0 Q 0 54 -62 0 Z" fill="none" stroke={C.blue} strokeWidth={7} strokeLinejoin="round" />
        <circle r={20} fill={C.blue} />
        <circle r={8} fill={C.bg} />
      </g>
      <text x={cx} y={cy + r1 + 70} textAnchor="middle" fontFamily={FONT.mono} fontWeight={500} fontSize={30} letterSpacing="0.4em" fill={C.dim}>
        EST. 1914
      </text>
    </g>
  );
};
