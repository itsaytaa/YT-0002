// HUD, captions, grain, vignette and the caption scrim.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONT, style } from "../theme";
import { rand } from "../anim";
import { useEpisodeMeta, fill } from "../episode-context";

const hud = style.hud;

export const Hud: React.FC<{ directive: number | null }> = ({ directive }) => {
  const meta = useEpisodeMeta();
  const items = hud.progress.items;
  const cur = directive == null ? -1 : directive - 1;
  const mono: React.CSSProperties = { fontFamily: FONT.mono, fontWeight: 500, letterSpacing: hud.topLeft.letterSpacing, color: C.dim, fontSize: hud.topLeft.size, lineHeight: 1.45 };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: hud.topLeft.x, top: hud.topLeft.y - 22, ...mono }}>
        {hud.topLeft.lines.map((l) => (
          <div key={l}>{fill(l, meta)}</div>
        ))}
      </div>
      <div style={{ position: "absolute", right: 1920 - hud.topRight.x, top: hud.topRight.y - 22, ...mono, textAlign: "right" }}>{hud.topRight.text}</div>
      <div style={{ position: "absolute", right: 1920 - hud.progress.position.x, top: hud.progress.position.y - 14, display: "flex", gap: 10 }}>
        {items.map((it, i) => {
          const isCur = i === cur;
          const color = isCur ? C.fg : i < cur ? C.dim : C.line;
          return (
            <div
              key={it}
              style={{
                fontFamily: FONT.mono,
                fontWeight: 500,
                fontSize: 14,
                letterSpacing: "0.12em",
                color,
                padding: "3px 6px 2px 7px",
                border: `1.5px solid ${isCur ? C.blue : "transparent"}`,
                boxShadow: isCur ? `0 0 10px rgba(108,182,224,0.35)` : undefined,
              }}
            >
              {it}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Caption: sentence case exactly as in scenes.json; emphasis phrases coloured.
function emphasize(caption: string, emphasis: string[], color: string) {
  type Part = { text: string; em: boolean };
  let parts: Part[] = [{ text: caption, em: false }];
  for (const phrase of emphasis) {
    const next: Part[] = [];
    for (const p of parts) {
      if (p.em) {
        next.push(p);
        continue;
      }
      const i = p.text.toLowerCase().indexOf(phrase.toLowerCase());
      if (i < 0) {
        next.push(p);
        continue;
      }
      next.push({ text: p.text.slice(0, i), em: false }, { text: p.text.slice(i, i + phrase.length), em: true }, { text: p.text.slice(i + phrase.length), em: false });
    }
    parts = next;
  }
  return parts.filter((p) => p.text).map((p, k) => (p.em ? <span key={k} style={{ color }}>{p.text}</span> : <span key={k}>{p.text}</span>));
}

export const Caption: React.FC<{ caption: string; emphasis: string[]; red: boolean; ghost?: boolean }> = ({ caption, emphasis, red, ghost }) => {
  const cap = style.captions;
  const box = (extra: React.CSSProperties, color: string, em: string) => (
    <div
      style={{
        position: "absolute",
        left: (1920 - cap.maxWidth) / 2,
        width: cap.maxWidth,
        top: cap.centerY,
        transform: "translateY(-50%)",
        textAlign: "center",
        fontFamily: FONT.caption,
        fontWeight: 600,
        fontSize: cap.size,
        lineHeight: cap.lineHeight,
        color,
        textShadow: cap.shadow,
        ...extra,
      }}
    >
      {emphasize(caption, emphasis, em)}
    </div>
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {ghost && box({ transform: "translate(6px, calc(-50% - 3px))", opacity: 0.5, textShadow: "none" }, C.blue, C.blue)}
      {box({}, C.fg, red ? C.red : C.blue)}
    </AbsoluteFill>
  );
};

export const Grain: React.FC<{ frame: number }> = ({ frame }) => {
  const k = Math.floor(frame / 2);
  const i = (k % 8) + 1;
  const ox = Math.floor(rand(k) * 512), oy = Math.floor(rand(k + 99) * 512);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile(`grain/g${i}.png`)})`,
        backgroundPosition: `${ox}px ${oy}px`,
        backgroundRepeat: "repeat",
        opacity: style.effects ? 0.06 : 0.06,
        mixBlendMode: "overlay",
        pointerEvents: "none",
        filter: "contrast(1.6)",
      }}
    />
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 75% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`, pointerEvents: "none" }} />
);

// Keeps the caption zone clean: scene content fades into the background below y≈840.
export const CaptionScrim: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(11,13,16,0.8) 0px, rgba(11,13,16,0.55) 70px, rgba(11,13,16,0) 120px, rgba(11,13,16,0) 820px, rgba(11,13,16,0.82) 905px, rgba(11,13,16,0.9) 1080px)", pointerEvents: "none" }} />
);

export { Img };
