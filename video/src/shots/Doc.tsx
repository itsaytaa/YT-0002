// Paper document (style.json -> documents): typed mono text, redaction bars, marker
// highlights, rubber stamps, and the entry/typing/redaction animations.
import React from "react";
import { C, FONT } from "../theme";
import { clamp01, ease, lerp, prog, shake } from "../anim";
import { Stamp } from "./Stamp";
import { STAMP_LAND } from "./Cards";
import { useEpisodeMeta } from "../episode-context";

export const PAPER = { w: 1100, h: 700, cx: 960, cy: 478 };
const FS = 30;
const CW = FS * 0.6; // IBM Plex Mono advance width
const LH = FS * 1.5;
const LEFT = PAPER.cx - PAPER.w / 2 + 90;
const BLUE_INK = "#2D6F98";
const RED_INK = "#B8322A";

type Seg = { text: string; bar: boolean; start: number };
const segments = (s: string): Seg[] => {
  const out: Seg[] = [];
  let i = 0;
  while (i < s.length) {
    const bar = s[i] === "█";
    let j = i;
    while (j < s.length && (s[j] === "█") === bar) j++;
    out.push({ text: s.slice(i, j), bar, start: i });
    i = j;
  }
  return out;
};

export type DocLayout = { headerY: number[]; lineY: number[] };

export function layoutDoc(doc: any): DocLayout & { header: string[]; lines: string[] } {
  const top = PAPER.cy - PAPER.h / 2 + 96;
  let header: string[] = doc.header ?? [];
  let lines: string[] = doc.lines ?? [];
  if (!header.length && lines.length) {
    header = [lines[0]];
    lines = lines.slice(1);
  }
  const headerY = header.map((_, i) => top + i * LH);
  const bodyTop = top + header.length * LH + 52;
  const lineY = lines.map((_, i) => bodyTop + i * (LH + 8));
  return { header, lines, headerY, lineY };
}

export const Doc: React.FC<{ doc: any; frame: number; fps: number; dur: number; audioFrames: number; id: string }> = ({ doc, frame, fps, dur, audioFrames, id }) => {
  const meta = useEpisodeMeta();
  const { header, lines, headerY, lineY } = layoutDoc(doc);
  const headerless = !doc.header?.length;
  const lineOffset = headerless ? 1 : 0; // spec line indices refer to doc.lines
  const li = (specIndex: number) => specIndex - lineOffset;
  const inherited = !!doc.inherited;

  // Entry / exit.
  let dy = 0;
  let op = 1;
  if (doc.anim === "slide-up" || (!inherited && !doc.anim) || doc.anim === "type-line" || doc.anim === "typewriter-then-redact" || doc.anim === "redact-line") {
    const p = prog(frame, 0, 12);
    dy = lerp(120, 0, p);
    op = p;
  }
  if (doc.anim === "slide-out") {
    const p = prog(frame, dur * 0.45, dur * 0.92, (x) => x * x * x);
    dy = lerp(0, 1000, p);
  }

  // Typing.
  const typeLine = doc.anim === "type-line" ? li(doc.type_line) : doc.anim === "typewriter-then-redact" ? lines.length - 1 : -1;
  const typeStart = 14;
  const typeRate = doc.anim === "typewriter-then-redact" ? 1.5 : 1.7;
  const typedText = (s: string) => (doc.anim === "typewriter-then-redact" ? s.replace(/█+/, "").trimEnd() : s);
  const typeLen = typeLine >= 0 ? typedText(lines[typeLine]).length : 0;
  const typeEnd = typeStart + typeLen * typeRate;
  const shownChars = (i: number) => (i === typeLine ? Math.max(0, Math.floor((frame - typeStart) / typeRate)) : Infinity);

  // Redaction bar growth.
  let redactLine = -1, redactStart = 0;
  if (doc.anim === "typewriter-then-redact") {
    redactLine = typeLine;
    redactStart = typeEnd + 6;
  }
  if (doc.anim === "redact-line") {
    redactLine = li(doc.redact_line);
    redactStart = Math.max(16, audioFrames * 0.28);
  }
  const redactP = redactLine >= 0 ? prog(frame, redactStart, redactStart + 14, (x) => x) : 1;

  // Highlights.
  const hlColor = doc.highlight_color === "red" ? C.red : C.blue;
  const highlights: number[] = (doc.highlight ?? []).map(li).filter((i: number) => i >= 0);
  const hlStart = (k: number) => (inherited && !doc.focus_line ? -100 : typeLine >= 0 ? typeEnd + 4 : doc.focus_line != null ? 20 : 14 + k * 5);

  // Stamp.
  const st = doc.stamp;
  const stampLand = doc.anim === "redact-line" ? redactStart + 14 + STAMP_LAND : STAMP_LAND;
  const stampIsNew = st && (!inherited || doc.ownStamp);
  let stampScale = 1, stampOp = 0.85;
  if (st && stampIsNew) {
    const p = prog(frame, stampLand - 8, stampLand, (x) => x * x);
    stampScale = lerp(1.3, 1, p);
    stampOp = frame < stampLand - 8 ? 0 : 0.85 * clamp01((frame - (stampLand - 8)) / 3);
  }
  if (st && doc.stampMode === "pulse") {
    const p = clamp01((frame - STAMP_LAND) / 12);
    stampScale = 1 + 0.12 * Math.sin(p * Math.PI);
    stampOp = 0.85 + 0.15 * Math.sin(p * Math.PI);
  }
  const shk = st && (stampIsNew || doc.stampMode === "pulse") ? shake(frame, stampLand, 4, 8) : { x: 0, y: 0 };
  let stampX = PAPER.cx + PAPER.w / 2 - 230, stampY = PAPER.cy + PAPER.h / 2 - 130;
  if (st && st.line != null) {
    const i = li(st.line);
    const stampHalfW = (st.text.length * 64 * 0.5 + 64 * 0.9) / 2;
    stampX = Math.min(PAPER.cx + PAPER.w / 2 - 70 - stampHalfW, LEFT + lines[i].length * CW + 40 + stampHalfW);
    stampY = lineY[i] - 12;
  } else if (st && redactLine >= 0) {
    stampX = PAPER.cx + 230;
    stampY = lineY[redactLine] + 120;
  }

  const pen = doc.anim === "typewriter-then-redact";
  const cursorX = typeLine >= 0 ? LEFT + Math.min(typeLen, shownChars(typeLine)) * CW : 0;
  const penLift = pen ? prog(frame, redactStart + 18, redactStart + 34) : 0;

  return (
    <g transform={`translate(${shk.x} ${shk.y + dy})`} opacity={op}>
      <g transform={`rotate(-1 ${PAPER.cx} ${PAPER.cy})`}>
        <defs>
          <filter id={`grain${id}`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0.09 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <linearGradient id={`shade${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={0.06} />
            <stop offset="1" stopColor="#000" stopOpacity={0.08} />
          </linearGradient>
        </defs>
        <rect x={PAPER.cx - PAPER.w / 2 + 10} y={PAPER.cy - PAPER.h / 2 + 14} width={PAPER.w} height={PAPER.h} fill="#000" opacity={0.45} filter="url(#soft)" />
        <rect x={PAPER.cx - PAPER.w / 2} y={PAPER.cy - PAPER.h / 2} width={PAPER.w} height={PAPER.h} fill={C.paper} stroke="#BDB5A3" strokeWidth={1} />
        <rect x={PAPER.cx - PAPER.w / 2} y={PAPER.cy - PAPER.h / 2} width={PAPER.w} height={PAPER.h} fill={C.paper} filter={`url(#grain${id})`} />
        <rect x={PAPER.cx - PAPER.w / 2} y={PAPER.cy - PAPER.h / 2} width={PAPER.w} height={PAPER.h} fill={`url(#shade${id})`} />
        {/* punch holes and furniture */}
        {[0.3, 0.7].map((f) => (
          <circle key={f} cx={PAPER.cx - PAPER.w / 2 + 34} cy={PAPER.cy - PAPER.h / 2 + PAPER.h * f} r={11} fill={C.bg} opacity={0.9} />
        ))}
        <g opacity={0.55}>
          <circle cx={PAPER.cx + PAPER.w / 2 - 92} cy={PAPER.cy - PAPER.h / 2 + 84} r={34} fill="none" stroke={C.ink} strokeWidth={2} />
          <circle cx={PAPER.cx + PAPER.w / 2 - 92} cy={PAPER.cy - PAPER.h / 2 + 84} r={26} fill="none" stroke={C.ink} strokeWidth={1} />
          <path d={`M${PAPER.cx + PAPER.w / 2 - 108} ${PAPER.cy - PAPER.h / 2 + 96} v -14 l 16 -12 l 16 12 v 14 z`} fill="none" stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />
          <ellipse cx={PAPER.cx + PAPER.w / 2 - 92} cy={PAPER.cy - PAPER.h / 2 + 88} rx={6} ry={3.5} fill={C.ink} />
        </g>
        <text x={PAPER.cx + PAPER.w / 2 - 150} y={PAPER.cy - PAPER.h / 2 + 150} textAnchor="middle" fontFamily={FONT.mono} fontSize={15} letterSpacing="0.14em" fill={C.ink} opacity={0.55}>
          REF. DUR/{meta.advisory}
        </text>
        <text x={PAPER.cx} y={PAPER.cy + PAPER.h / 2 - 34} textAnchor="middle" fontFamily={FONT.mono} fontSize={15} letterSpacing="0.2em" fill={C.ink} opacity={0.5}>
          DEPARTMENT OF UNLISTED RISKS · PAGE 1 OF 1
        </text>

        {header.map((h, i) => (
          <text key={i} x={LEFT} y={headerY[i]} fontFamily={FONT.mono} fontWeight={i === 0 ? 600 : 400} fontSize={FS} letterSpacing={i === 0 ? "0.12em" : "0.02em"} fill={C.ink}>
            {h}
          </text>
        ))}
        <path d={`M${LEFT} ${headerY[headerY.length - 1] + 26} H ${PAPER.cx + PAPER.w / 2 - 90}`} stroke={C.ink} strokeWidth={2} opacity={0.7} />

        {highlights.map((i, k) => {
          const p = prog(frame, hlStart(k), hlStart(k) + 10, (x) => x);
          const w = lines[i].length * CW + 20;
          return <rect key={`h${i}`} x={LEFT - 10} y={lineY[i] - FS * 0.95} width={w * p} height={FS * 1.3} fill={hlColor} opacity={0.35} />;
        })}

        {lines.map((ln, i) => {
          const limit = shownChars(i);
          const typedPart = typedText(ln);
          return (
            <g key={i}>
              {segments(ln).map((sg, k) => {
                if (sg.bar) {
                  const isRedacting = i === redactLine;
                  const w = sg.text.length * CW * (isRedacting ? redactP : 1);
                  if (i === typeLine && doc.anim !== "typewriter-then-redact" && limit < sg.start) return null;
                  return <rect key={k} x={LEFT + sg.start * CW} y={lineY[i] - FS * 0.72 - 3} width={w} height={FS * 0.72 + 6} fill={C.redaction} />;
                }
                const visible = sg.text.slice(0, Math.max(0, Math.min(sg.text.length, limit - sg.start)));
                if (i === typeLine && sg.start >= typedPart.length) return null;
                return (
                  <text key={k} x={LEFT + sg.start * CW} y={lineY[i]} fontFamily={FONT.mono} fontWeight={400} fontSize={FS} fill={i === typeLine && doc.anim === "type-line" ? BLUE_INK : C.ink} style={{ whiteSpace: "pre" }}>
                    {visible}
                  </text>
                );
              })}
              {i === redactLine && doc.anim === "redact-line" && (
                <rect x={LEFT - 6} y={lineY[i] - FS * 0.72 - 4} width={(ln.length * CW + 12) * redactP} height={FS * 0.72 + 8} fill={C.redaction} />
              )}
            </g>
          );
        })}
        {typeLine >= 0 && frame < typeEnd + 4 && Math.floor(frame / 8) % 2 === 0 && !pen && (
          <rect x={cursorX + 2} y={lineY[typeLine] - FS * 0.75} width={3} height={FS * 0.9} fill={C.ink} />
        )}
        {pen && (
          <g transform={`translate(${cursorX + (frame > redactStart ? lerp(0, (lines[typeLine].length - typeLen) * CW, redactP) : 0) + 6 + penLift * 120} ${lineY[typeLine] - 8 - penLift * 140}) rotate(${32 + penLift * 8})`} opacity={1 - penLift}>
            <rect x={-6} y={-150} width={12} height={130} rx={5} fill="#2A2F37" />
            <rect x={-6} y={-150} width={12} height={26} rx={5} fill={C.dim} />
            <path d="M-6 -20 L 0 0 L 6 -20 Z" fill="#59616B" />
          </g>
        )}
        {lines.length <= 3 && (
          <g fontFamily={FONT.mono} fontSize={18} letterSpacing="0.16em" fill={C.ink} opacity={0.55}>
            <text x={LEFT} y={PAPER.cy + PAPER.h / 2 - 150}>RECORDED BY</text>
            <path d={`M${LEFT + 190} ${PAPER.cy + PAPER.h / 2 - 150} H ${LEFT + 470}`} stroke={C.ink} strokeWidth={1.2} />
            <rect x={LEFT + 200} y={PAPER.cy + PAPER.h / 2 - 170} width={190} height={16} fill={C.redaction} opacity={0.85} />
            <text x={LEFT + 540} y={PAPER.cy + PAPER.h / 2 - 150}>DATE</text>
            <path d={`M${LEFT + 620} ${PAPER.cy + PAPER.h / 2 - 150} H ${LEFT + 860}`} stroke={C.ink} strokeWidth={1.2} />
            <text x={LEFT + 630} y={PAPER.cy + PAPER.h / 2 - 156} fontSize={20} letterSpacing="0.08em">██/██/████</text>
            <text x={LEFT} y={PAPER.cy + PAPER.h / 2 - 100}>FILED UNDER</text>
            <path d={`M${LEFT + 190} ${PAPER.cy + PAPER.h / 2 - 100} H ${LEFT + 470}`} stroke={C.ink} strokeWidth={1.2} />
            <text x={LEFT + 200} y={PAPER.cy + PAPER.h / 2 - 106} fontSize={20} letterSpacing="0.1em">UNLISTED</text>
          </g>
        )}
        {st && <Stamp id={`st${id}`} x={stampX} y={stampY} text={st.text} size={64} rot={-8} scale={stampScale} opacity={stampOp} color={st.color === "blue" ? C.blue : C.red} seed={id.length * 3} />}
      </g>
    </g>
  );
};

// Zoom target for doc.focus_line (camera pan-to).
export function docFocusPoint(doc: any) {
  const { lineY, lines } = layoutDoc(doc);
  const i = (doc.focus_line ?? 0) - (doc.header?.length ? 0 : 1);
  return { x: LEFT + (lines[i]?.length ?? 10) * CW * 0.5, y: lineY[i] ?? PAPER.cy };
}

export { RED_INK, ease };
