// Fonts are self-hosted in public/fonts (official Google Fonts files) and embedded at
// render time. The headless browser cannot reach fonts.gstatic.com from this machine,
// so @remotion/google-fonts' network loader is not used.
import { continueRender, delayRender, staticFile } from "remotion";

const faces: Array<[string, string, string]> = [
  ["Archivo", "Archivo-Variable.ttf", "100 900"],
  ["IBM Plex Sans Condensed", "IBMPlexSansCondensed-SemiBold.ttf", "600"],
  ["IBM Plex Mono", "IBMPlexMono-Regular.ttf", "400"],
  ["IBM Plex Mono", "IBMPlexMono-Medium.ttf", "500"],
  ["IBM Plex Mono", "IBMPlexMono-SemiBold.ttf", "600"],
];

let loaded = false;
export function loadFonts() {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("fonts");
  Promise.all(
    faces.map(([family, file, weight]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, {
        weight,
        ...(family === "Archivo" ? { stretch: "62% 125%" } : {}),
      });
      (document.fonts as any).add(face);
      return face.load();
    }),
  ).then(
    () => continueRender(handle),
    (e) => {
      console.error(e);
      continueRender(handle);
    },
  );
}
