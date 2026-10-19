// Step 7 review: one still per shot (middle frame of the first line that uses it),
// then a 6-column contact sheet. Usage: node scripts/review-stills.mjs [S01 S02 ...]
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { root, ep, epId, scenes, readJson } from "./lib.mjs";

const require = createRequire(join(root, "video/package.json"));
const { bundle } = require("@remotion/bundler");
const { renderStill, selectComposition } = require("@remotion/renderer");

const timings = readJson(ep("timings.json"));
const outDir = join(root, ep("out/review"));
mkdirSync(outDir, { recursive: true });

// First line per shot, in shot order.
const frames = [];
for (const id of Object.keys(scenes.shots)) {
  if (id === "END") {
    frames.push({ id, frame: timings.endCard.startFrame + Math.round(timings.endCard.durationFrames * 0.5) });
    continue;
  }
  const i = scenes.lines.findIndex((l) => l.shot === id);
  if (i < 0) continue;
  const t = timings.lines[i];
  frames.push({ id, frame: Math.round((t.startFrame + t.endFrame) / 2) });
}
const only = process.argv.slice(2);
const todo = only.length ? frames.filter((f) => only.includes(f.id)) : frames;

const serveUrl = await bundle({ entryPoint: join(root, "video/src/index.ts"), publicDir: join(root, "video/public") });
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
const composition = await selectComposition({ serveUrl, id: `Advisory-${epId}`, browserExecutable });
for (const { id, frame } of todo) {
  await renderStill({ composition, serveUrl, output: join(outDir, `${id}.png`), frame, imageFormat: "png", browserExecutable });
  console.log(`${id} @ ${frame}`);
}

// Contact sheet: label each still with its shot id, tile 6 across.
const labelled = join(outDir, "_labelled");
mkdirSync(labelled, { recursive: true });
frames.forEach(({ id }, i) => {
  const src = join(outDir, `${id}.png`);
  if (!existsSync(src)) return;
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-vf", `scale=480:270,drawbox=x=0:y=0:w=86:h=30:color=black@0.75:t=fill,drawtext=fontfile=${join(root, "video/public/fonts/IBMPlexMono-SemiBold.ttf")}:text='${id}':x=8:y=6:fontsize=18:fontcolor=white`, join(labelled, `${String(i).padStart(3, "0")}.png`)]);
});
const rows = Math.ceil(frames.length / 6);
execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", "1", "-i", join(labelled, "%03d.png"), "-vf", `tile=6x${rows}:padding=6:margin=6:color=0x222222`, "-frames:v", "1", join(outDir, "contact-sheet.png")]);
console.log(`contact sheet: ${frames.length} shots, ${rows} rows`);
