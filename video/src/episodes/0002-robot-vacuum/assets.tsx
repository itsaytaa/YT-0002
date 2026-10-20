// Advisory 0002: episode-specific assets (spec: advisories/0002-robot-vacuum/assets-spec.md).
// Everything else in the episode is drawn by the kit. Larger pieces live next to this file:
// vacuum.tsx (robot-vacuum, dust-trail), phone.tsx (phone), map.tsx (vacuum-map).
//
// Rules (brand/BRAND.md §5): palette tokens only, figures solid fg with GLOW, furniture as
// outline-on-surface with 2–3 px strokes, annotations 3 px blue/red, kit anim helpers.
import React from "react";
import { C } from "../../theme";
import { ease, prog } from "../../anim";
import type { CustomElementProps, EpisodeAssets } from "../../episode-context";
import { BoxFront } from "../../figures/Props";
import { RobotVacuum, DustTrail } from "./vacuum";
import { Phone } from "./phone";
import { VacuumMapShot } from "./map";

const S = { stroke: C.line, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

// The charging dock: a back plate standing on the floor with a slanted base lip at the
// front; the docked vacuum sits on the lip in front of the plate.
const Dock: React.FC<CustomElementProps> = ({ e }) => {
  const w: number = e.w ?? 120;
  const x: number = e.x, y: number = e.y ?? 780;
  const h = w * 0.9, lip = w * 0.15;
  const led = e.led ?? "blue";
  return (
    <g>
      <rect x={x - w / 2} y={y - h} width={w} height={h - lip * 0.4} rx={w * 0.12} fill={C.surface2} {...S} />
      <path d={`M${x - w * 0.36} ${y - h + w * 0.2} H ${x + w * 0.36}`} stroke={C.line} strokeWidth={2} opacity={0.7} />
      <path d={`M${x - w * 0.62} ${y} L ${x - w * 0.5} ${y - lip} L ${x + w * 0.5} ${y - lip} L ${x + w * 0.62} ${y} Z`} fill={C.surface} {...S} />
      {[-0.18, 0.18].map((u) => (
        <rect key={u} x={x + u * w - w * 0.06} y={y - lip - w * 0.05} width={w * 0.12} height={w * 0.05} rx={1.5} fill={C.dim} />
      ))}
      <circle cx={x} cy={y - h + w * 0.1} r={4} fill={led === "off" ? C.line : C.blue} filter={led === "off" ? undefined : "url(#glowBlue)"} />
    </g>
  );
};

// A wall in cross-section: solid surface with diagonal hatching, plus short stubs of floor
// and ceiling line on both sides.
const Wall: React.FC<CustomElementProps> = ({ e }) => {
  const h: number = e.h ?? 620;
  const th: number = e.thickness ?? 34;
  const x: number = e.x, y: number = e.y ?? 780;
  const l = x - th / 2, top = y - h;
  const id = `wall${Math.round(x)}${Math.round(y)}`;
  const hatch: React.ReactNode[] = [];
  for (let k = -th; k < h + th; k += 14) hatch.push(<path key={k} d={`M${l} ${top + k + th} L ${l + th} ${top + k}`} />);
  return (
    <g>
      <clipPath id={id}>
        <rect x={l} y={top} width={th} height={h} />
      </clipPath>
      <rect x={l} y={top} width={th} height={h} fill={C.surface2} />
      <g clipPath={`url(#${id})`} stroke={C.line} strokeWidth={1.5} opacity={0.4}>
        {hatch}
      </g>
      <rect x={l} y={top} width={th} height={h} fill="none" {...S} />
      <path d={`M${l - 40} ${y} H ${l} M${l + th} ${y} H ${l + th + 40} M${l - 40} ${top} H ${l} M${l + th} ${top} H ${l + th + 40}`} {...S} />
    </g>
  );
};

// A knock, drawn as sound: three concentric arcs opening to both sides, expanding over
// 10 frames and fading over 18.
const Knock: React.FC<CustomElementProps> = ({ e, t, fps }) => {
  const size: number = e.size ?? 1;
  const red = e.color === "red";
  const color = red ? C.red : C.dim;
  const times: number[] = e.at ?? [0];
  return (
    <g stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" filter={red ? "url(#glowRed)" : undefined}>
      {times.map((at, i) => {
        const k = t - at * fps;
        if (k < 0 || k > 28) return null;
        const grow = prog(k, 0, 10, ease);
        const op = 1 - prog(k, 10, 28, (v) => v);
        return (
          <g key={i} opacity={op}>
            {[0.4, 0.7, 1].map((f, j) => {
              const r = (14 + (60 - 14) * grow) * f * size;
              const a = (40 * Math.PI) / 180;
              const arc = (side: number) => {
                const x0 = e.x + side * r * Math.cos(a), y0 = e.y - r * Math.sin(a);
                const x1 = e.x + side * r * Math.cos(a), y1 = e.y + r * Math.sin(a);
                return `M${x0} ${y0} A ${r} ${r} 0 0 ${side > 0 ? 1 : 0} ${x1} ${y1}`;
              };
              return (
                <g key={j} opacity={1 - j * 0.12}>
                  <path d={arc(1)} />
                  <path d={arc(-1)} />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

// The kit's `box` element draws only the back flaps (its front is added when a cat sits
// inside). S73 needs a whole open box with the new vacuum in it, so this places the kit's
// own BoxFront in front of it. Not a redraw: it is the kit prop.
const BoxFrontEl: React.FC<CustomElementProps> = ({ e }) => <BoxFront x={e.x} y={e.y ?? 780} w={e.w ?? 420} />;

export const assets: EpisodeAssets = {
  elements: {
    "robot-vacuum": RobotVacuum,
    dock: Dock,
    "dust-trail": DustTrail,
    phone: Phone,
    wall: Wall,
    knock: Knock,
    "box-front": BoxFrontEl,
  },
  shots: {
    "vacuum-map": VacuumMapShot,
  },
};
