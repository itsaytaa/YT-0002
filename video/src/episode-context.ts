// The current episode's display values (advisory number, end stamp), for kit components
// that print them (HUD, directive cards, documents, end card).
import React from "react";
import type { EpisodeMeta } from "./engine";

export const EpisodeMetaContext = React.createContext<EpisodeMeta>({
  id: "0000",
  slug: "0000-preview",
  advisory: "0000",
  title: "",
  endStamp: "ONGOING.",
  endSub: "NEXT ADVISORY: 0001",
});

export const useEpisodeMeta = () => React.useContext(EpisodeMetaContext);

// Fills {advisory} placeholders used in style.json strings.
export const fill = (s: string, meta: EpisodeMeta) => s.replace(/\{advisory\}/g, meta.advisory);

// Episode-specific assets. The shared kit draws everything in brand/catalog.json; an
// episode may add its own element kinds (drawn inside a tableau) and shot types for
// features no earlier advisory needed. Register them in src/episodes/<slug>/assets.tsx.
// Promote an asset into the kit (figures/ or shots/ + catalog + reference sheet) as soon
// as a second advisory wants it.
export type CustomElementProps = {
  e: { el: string; [k: string]: any };
  t: number; // frames since the element appeared (after its delay)
  dur: number; // frames of the line it appeared on
  fps: number;
};
export type CustomShotProps = { shot: any; frame: number; dur: number; fps: number; audioFrames: number };
export type EpisodeAssets = {
  elements?: Record<string, React.FC<CustomElementProps>>;
  shots?: Record<string, React.FC<CustomShotProps>>;
};
export const EpisodeAssetsContext = React.createContext<EpisodeAssets>({});
export const useEpisodeAssets = () => React.useContext(EpisodeAssetsContext);
