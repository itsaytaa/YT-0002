// Advisory 0002: a smartphone showing the vacuum app. The screen is the only light in
// the room. Spec: assets-spec.md → `phone`.
import React from "react";
import { C, FONT, DISPLAY_STYLE } from "../../theme";
import { prog } from "../../anim";
import type { CustomElementProps } from "../../episode-context";
import { MapView, type MapFields } from "./map";

const SCREEN = "#0E1216"; // screen fill (assets-spec.md)

export const Phone: React.FC<CustomElementProps> = ({ e, t, dur, fps }) => {
  const h: number = e.h ?? 760;
  const w = h * 0.5;
  const x: number = e.x, y: number = e.y;
  const l = x - w / 2, top = y - h / 2;
  const inset = h * 0.03;
  const sx = l + inset, sy = top + inset, sw = w - 2 * inset, sh = h - 2 * inset;
  const small = h < 300;
  const sec = t / fps;
  const time: string = e.time ?? (e.screen === "schedule" ? "03:00" : "03:07");
  const id = `ph${Math.round(x)}${Math.round(y)}`;
  const on = prog(t, 0, 8, (v) => v);

  // --- screen content (unit = h / 100)
  const u = h / 100;
  const mono = { fontFamily: FONT.mono, fontWeight: 500 } as const;
  const mapW = sw - 4 * u;
  const mapScale = mapW / 1000;
  const mapFields: MapFields = { rooms: "static", clean: "none", vacuum: "hall", ...(e.map ?? {}) };
  const map = (mx: number, my: number, extra?: Partial<MapFields>) => (
    <g transform={`translate(${mx} ${my}) scale(${mapScale})`}>
      <MapView m={{ ...mapFields, ...extra }} c={{ t, dur, fps, audio: 0 }} mode="phone" uid={id} moving={e.screen === "map" && !small} />
    </g>
  );
  const pulse = 0.5 + 0.5 * Math.sin(sec * Math.PI * 2 * 0.6);

  let content: React.ReactNode = null;
  if (small) {
    content = <g opacity={0.8}>{map(sx + 2 * u, sy + sh * 0.3, { vacuum: "hall" })}</g>;
  } else {
    const header = (
      <g>
        <text x={sx + 4 * u} y={sy + 5.2 * u} {...mono} fontSize={2.4 * u} letterSpacing="0.08em" fill={C.dim}>
          {time}
        </text>
        <g opacity={0.8}>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={sx + sw - 9.5 * u + i * 1.3 * u} y={sy + 5.2 * u - (1 + i * 0.6) * u} width={0.8 * u} height={(1 + i * 0.6) * u} fill={C.dim} />
          ))}
          <rect x={sx + sw - 5.2 * u} y={sy + 3.4 * u} width={3 * u} height={1.6 * u} rx={0.3 * u} fill="none" stroke={C.dim} strokeWidth={0.25 * u} />
          <rect x={sx + sw - 4.9 * u} y={sy + 3.7 * u} width={1.4 * u} height={1 * u} fill={C.dim} />
        </g>
        <circle cx={sx + 5 * u} cy={sy + 11 * u} r={0.9 * u} fill={C.blue} filter="url(#glowBlue)" />
        <text x={sx + 7.2 * u} y={sy + 11.9 * u} {...mono} fontSize={2.6 * u} letterSpacing="0.32em" fill={C.fg}>
          VACUUM
        </text>
        <path d={`M${sx + 4 * u} ${sy + 14.5 * u} H ${sx + sw - 4 * u}`} stroke={C.line} strokeWidth={0.2 * u} />
      </g>
    );
    if (e.screen === "schedule") {
      const row = (yy: number, a: string) => (
        <g>
          <text x={sx + 4 * u} y={yy} {...mono} fontSize={2.3 * u} letterSpacing="0.1em" fill={C.dim}>
            {a}
          </text>
          <text x={sx + sw - 4 * u} y={yy} textAnchor="end" {...mono} fontSize={2.3 * u} letterSpacing="0.1em" fill={C.fg}>
            NONE
          </text>
          <path d={`M${sx + 4 * u + 9.5 * 2.3 * u * 0.65} ${yy - 0.6 * u} H ${sx + sw - 4 * u - 6 * 2.3 * u * 0.65}`} stroke={C.line} strokeWidth={0.3 * u} strokeDasharray={`${0.3 * u} ${0.9 * u}`} />
        </g>
      );
      content = (
        <g>
          {header}
          <text x={sx + 4 * u} y={sy + 22 * u} {...mono} fontSize={2.2 * u} letterSpacing="0.3em" fill={C.dim}>
            SCHEDULE
          </text>
          {row(sy + 29 * u, "MON–FRI")}
          {row(sy + 34.5 * u, "SAT–SUN")}
          <path d={`M${sx + 4 * u} ${sy + 39 * u} H ${sx + sw - 4 * u}`} stroke={C.line} strokeWidth={0.2 * u} />
          <text x={sx + 4 * u} y={sy + 50 * u} {...mono} fontSize={2.2 * u} letterSpacing="0.3em" fill={C.dim}>
            STATUS
          </text>
          <circle cx={sx + 6 * u} cy={sy + 57.4 * u} r={1.3 * u} fill={C.blue} opacity={0.45 + 0.55 * pulse} filter="url(#glowBlue)" />
          <circle cx={sx + 6 * u} cy={sy + 57.4 * u} r={(1.3 + 2.2 * pulse) * u} fill="none" stroke={C.blue} strokeWidth={0.25 * u} opacity={0.5 * (1 - pulse)} />
          <text x={sx + 10 * u} y={sy + 59.6 * u} style={DISPLAY_STYLE} fontSize={6.6 * u} letterSpacing="0.02em" fill={C.fg} filter="url(#glowSoft)">
            CLEANING
          </text>
          <text x={sx + 4 * u} y={sy + 65.5 * u} {...mono} fontSize={2 * u} letterSpacing="0.14em" fill={C.dim}>
            UNSCHEDULED · {time}
          </text>
          {/* a faint hint of the map at the bottom */}
          <g opacity={0.35}>{map(sx + 2 * u, sy + 72 * u, { vacuum: "hall" })}</g>
        </g>
      );
    } else {
      const mapY = sy + 19 * u;
      const mapH = 600 * mapScale;
      content = (
        <g>
          {header}
          <text x={sx + 4 * u} y={sy + 17.4 * u} {...mono} fontSize={2 * u} letterSpacing="0.3em" fill={C.dim}>
            LIVE MAP
          </text>
          {map(sx + 2 * u, mapY)}
          <circle cx={sx + 5 * u} cy={mapY + mapH + 5.4 * u} r={0.8 * u} fill={C.blue} opacity={0.4 + 0.6 * pulse} />
          <text x={sx + 7.2 * u} y={mapY + mapH + 6.2 * u} {...mono} fontSize={2.3 * u} letterSpacing="0.16em" fill={C.fg}>
            CLEANING · HALLWAY
          </text>
          <text x={sx + 7.2 * u} y={mapY + mapH + 9.6 * u} {...mono} fontSize={1.9 * u} letterSpacing="0.14em" fill={C.dim}>
            {time} · NO SCHEDULE
          </text>
          {/* run stats */}
          {[["AREA", "38 m²"], ["TIME", "07 MIN"], ["BATTERY", "61%"]].map(([k, v], i) => (
            <g key={k}>
              <text x={sx + 4 * u + i * ((sw - 8 * u) / 3)} y={mapY + mapH + 17 * u} {...mono} fontSize={1.7 * u} letterSpacing="0.2em" fill={C.dim}>
                {k}
              </text>
              <text x={sx + 4 * u + i * ((sw - 8 * u) / 3)} y={mapY + mapH + 21.2 * u} {...mono} fontWeight={600} fontSize={2.6 * u} letterSpacing="0.06em" fill={C.fg}>
                {v}
              </text>
            </g>
          ))}
          {e.screen === "dock-button" && (() => {
            const bp = 0.6 + 0.4 * (0.5 - 0.5 * Math.cos((sec / 1.2) * Math.PI * 2));
            const by = sy + sh - 22 * u;
            return (
              <g>
                <rect x={sx + 5 * u} y={by} width={sw - 10 * u} height={10 * u} rx={2.2 * u} fill={C.blue} opacity={0.06 * bp} />
                <rect x={sx + 5 * u} y={by} width={sw - 10 * u} height={10 * u} rx={2.2 * u} fill="none" stroke={C.blue} strokeWidth={2} opacity={bp} filter="url(#glowBlue)" />
                <text x={sx + sw / 2} y={by + 6.2 * u} textAnchor="middle" {...mono} fontWeight={600} fontSize={2.6 * u} letterSpacing="0.22em" fill={C.fg}>
                  RETURN TO DOCK
                </text>
              </g>
            );
          })()}
        </g>
      );
    }
  }

  return (
    <g opacity={on} transform={e.tilt ? `rotate(${e.tilt} ${x} ${y})` : undefined}>
      <defs>
        <radialGradient id={`${id}glow`} cx={x} cy={y} r={h * 0.85} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.fg} stopOpacity={0.1} />
          <stop offset="1" stopColor={C.fg} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}pool`} cx={x} cy={y + h * 0.35} r={h * 2.6} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.fg} stopOpacity={0.09} />
          <stop offset="0.5" stopColor={C.blue} stopOpacity={0.035} />
          <stop offset="1" stopColor={C.blue} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}clip`}>
          <rect x={sx} y={sy} width={sw} height={sh} rx={h * 0.05} />
        </clipPath>
      </defs>
      {e.glow && <ellipse cx={x} cy={y + h * 0.35} rx={h * 2.6} ry={h * 1.1} fill={`url(#${id}pool)`} />}
      <circle cx={x} cy={y} r={h * 0.85} fill={`url(#${id}glow)`} />
      <rect x={l} y={top} width={w} height={h} rx={h * 0.07} fill={C.surface} stroke={C.line} strokeWidth={3} />
      <rect x={sx} y={sy} width={sw} height={sh} rx={h * 0.05} fill={SCREEN} />
      <g clipPath={`url(#${id}clip)`}>
        {content}
        {/* the faintest glass sheen */}
        <path d={`M${sx} ${sy + sh * 0.18} L ${sx + sw} ${sy} L ${sx + sw} ${sy + sh * 0.08} L ${sx} ${sy + sh * 0.3} Z`} fill={C.fg} opacity={0.025} />
      </g>
      {!small && <rect x={x - w * 0.12} y={top + inset * 0.45} width={w * 0.24} height={inset * 0.35} rx={inset * 0.2} fill={C.bg} opacity={0.9} />}
    </g>
  );
};

