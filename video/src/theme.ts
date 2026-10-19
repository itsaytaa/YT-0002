// Design tokens from style.json.
import style from "../../brand/style.json";

export const C = {
  bg: "#0B0D10",
  fg: "#EEF1F4",
  dim: "#6B7480",
  line: "#4A525C",
  grey: "#9AA3AE",
  blue: "#6CB6E0",
  red: "#E0443A",
  paper: "#E9E4D8",
  ink: "#1A1D22",
  redaction: "#0E0F11",
  // Derived tones (not in the palette, used for fills so outlines read as objects).
  surface: "#14181D",
  surface2: "#1B2027",
  manila: "#D9CBA3",
} as const;

export const FONT = {
  caption: "IBM Plex Sans Condensed",
  display: "Archivo",
  mono: "IBM Plex Mono",
};

// Archivo is a variable font; the display face is weight 800 at width 75.
export const DISPLAY_STYLE: React.CSSProperties = {
  fontFamily: FONT.display,
  fontWeight: 800,
  fontVariationSettings: "'wght' 800, 'wdth' 75",
  fontStretch: "75%",
};

export const W = style.canvas.width;
export const H = style.canvas.height;
export const FPS = style.canvas.fps;
export const GROUND = style.safeArea.groundY;

export const GLOW = "drop-shadow(0 0 6px rgba(238,241,244,0.35))";

export { style };
