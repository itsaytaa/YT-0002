// Directive card, addendum card and end card (style.json -> cards).
import React from "react";
import { C, FONT, DISPLAY_STYLE } from "../theme";
import { clamp01, ease, lerp, prog, shake } from "../anim";
import { Stamp } from "./Stamp";
import { useEpisodeMeta } from "../episode-context";

export const STAMP_LAND = 8;

const Rule: React.FC<{ p: number; color: string; y: number; w: number }> = ({ p, color, y, w }) => (
  <rect x={960 - w / 2} y={y} width={w * clamp01(p)} height={6} fill={color} filter={color === C.red ? "url(#glowRed)" : "url(#glowBlue)"} />
);

// Splits a title into lines of at most ~maxChars, keeping words whole.
function wrap(title: string, maxChars: number) {
  if (title.length <= maxChars) return [title];
  const comma = title.indexOf(", ");
  if (comma > 0) return [title.slice(0, comma + 1), title.slice(comma + 2)];
  const words = title.split(" ");
  let best: string[] = [title];
  let bestMax = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
    const m = Math.max(a.length, b.length);
    if (m < bestMax) {
      bestMax = m;
      best = [a, b];
    }
  }
  if (bestMax <= maxChars + 6) return best;
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

export const DirectiveCard: React.FC<{ n?: number; title: string; frame: number; audioFrames: number; addendum?: boolean }> = ({ n, title, frame, audioFrames, addendum }) => {
  const meta = useEpisodeMeta();
  const sc = lerp(1.15, 1, prog(frame, 0, 6));
  const sh = shake(frame, STAMP_LAND, 4, 8);
  const lines = addendum ? [] : wrap(title, 22);
  const words = title.split(" ");
  const typeEnd = Math.max(10, audioFrames * 0.6);
  const shownWords = Math.min(words.length, Math.floor((frame / typeEnd) * words.length) + (frame > 2 ? 1 : 0));
  const titleSize = lines.length > 1 ? 70 : 76;
  const numSize = addendum ? 200 : 260;
  const numY = addendum ? 520 : lines.length > 1 ? 450 : 480;
  let wi = 0;
  const titleTop = numY + 120;
  const ruleY = addendum ? 610 : titleTop + lines.length * titleSize * 1.05 - 6;
  const ruleP = addendum ? prog(frame, 14, 26) : prog(frame, typeEnd + 1, typeEnd + 13, (x) => x);
  return (
    <g transform={`translate(${sh.x} ${sh.y})`}>
      <text x={960} y={addendum ? 330 : lines.length > 1 ? 230 : 262} textAnchor="middle" fontFamily={FONT.mono} fontWeight={500} fontSize={20} letterSpacing="0.3em" fill={C.dim}>
        {`ADVISORY ${meta.advisory} · ${addendum ? "ADDENDUM" : "DIRECTIVE"}`}
      </text>
      <g transform={`translate(960 ${numY - numSize * 0.36}) scale(${sc}) translate(-960 ${-(numY - numSize * 0.36)})`}>
        <text x={960} y={numY} textAnchor="middle" style={DISPLAY_STYLE} fontSize={numSize} fill="none" stroke={C.fg} strokeWidth={3} letterSpacing={addendum ? "0.04em" : "0.02em"} filter="url(#glowSoft)">
          {addendum ? "ADDENDUM" : String(n).padStart(2, "0")}
        </text>
      </g>
      {addendum ? (
        <text x={960} y={680} textAnchor="middle" fontFamily={FONT.mono} fontWeight={500} fontSize={24} letterSpacing="0.34em" fill={C.dim} opacity={prog(frame, 10, 20)}>
          NOT FOR CIRCULATION
        </text>
      ) : (
        lines.map((ln, li) => (
          <text key={li} x={960} y={titleTop + li * titleSize * 1.05} textAnchor="middle" style={DISPLAY_STYLE} fontSize={titleSize} fill={C.fg} letterSpacing="0.02em">
            {ln.split(" ").map((w, k) => {
              const vis = wi++ < shownWords;
              return (
                <tspan key={k} opacity={vis ? 1 : 0}>
                  {(k ? " " : "") + w}
                </tspan>
              );
            })}
          </text>
        ))
      )}
      <Rule p={ruleP} color={addendum ? C.red : C.blue} y={ruleY} w={addendum ? 560 : Math.min(1300, Math.max(...lines.map((l) => l.length)) * titleSize * 0.5 + 40)} />
    </g>
  );
};

export const EndCard: React.FC<{ frame: number; dur: number }> = ({ frame, dur }) => {
  const meta = useEpisodeMeta();
  const land = STAMP_LAND;
  const sc = lerp(1.3, 1, prog(frame, 0, land, (x) => x * x));
  const sh = shake(frame, land, 6, 10);
  const fadeOut = 1 - prog(frame, dur - 12, dur, (x) => x);
  return (
    <g opacity={fadeOut} transform={`translate(${sh.x} ${sh.y})`}>
      <g opacity={clamp01(frame / 3)}>
        <Stamp id="endstamp" x={960} y={470} text={meta.endStamp} size={180} rot={-6} scale={sc} opacity={0.92} seed={11} />
      </g>
      <text x={960} y={680} textAnchor="middle" fontFamily={FONT.mono} fontWeight={500} fontSize={22} letterSpacing="0.3em" fill={C.dim} opacity={prog(frame, land + 6, land + 18)}>
        {meta.endSub}
      </text>
    </g>
  );
};

export { ease };
