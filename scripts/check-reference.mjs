// Renders the brand reference sheets and compares them with the golden images in
// brand/reference/. Run it after any change to the kit (video/src outside episodes/):
// a failure means characters, props, layout or cards no longer look like the channel.
//   node scripts/check-reference.mjs            compare (exit 1 on drift)
//   node scripts/check-reference.mjs --update   accept the new look (commit the PNGs
//                                               together with the kit change and a note in
//                                               brand/CHANGELOG.md)
// Optional: REMOTION_BROWSER_EXECUTABLE=/path/to/chrome-headless-shell
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "video/package.json"));
const { bundle } = require("@remotion/bundler");
const { renderStill, selectComposition } = require("@remotion/renderer");

const SHEETS = { characters: "Sheet-Characters", props: "Sheet-Props", layout: "Sheet-Layout", cards: "Sheet-Cards" };
const MIN_SSIM = 0.995;
const update = process.argv.includes("--update");
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;

const outDir = join(tmpdir(), "not-covered-reference");
mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: join(root, "video/src/index.ts"), publicDir: join(root, "video/public") });

let failed = 0;
for (const [name, id] of Object.entries(SHEETS)) {
  const composition = await selectComposition({ serveUrl, id, browserExecutable });
  const fresh = join(outDir, `${name}.png`);
  await renderStill({ composition, serveUrl, output: fresh, frame: 0, imageFormat: "png", browserExecutable });
  const golden = join(root, `brand/reference/${name}.png`);
  if (update || !existsSync(golden)) {
    copyFileSync(fresh, golden);
    console.log(`updated  brand/reference/${name}.png`);
    continue;
  }
  // ffmpeg prints the SSIM summary ("All:0.99...") on stderr.
  const r = spawnSync("ffmpeg", ["-nostats", "-i", fresh, "-i", golden, "-lavfi", "ssim", "-f", "null", "-"], { encoding: "utf8" });
  const ssim = parseFloat((r.stderr.match(/All:([\d.]+)/) || [])[1]);
  const ok = ssim >= MIN_SSIM;
  if (!ok) failed++;
  console.log(`${ok ? "ok      " : "DRIFT   "} ${name.padEnd(10)} SSIM ${ssim.toFixed(4)}${ok ? "" : `  (fresh render: ${fresh})`}`);
}
if (failed) {
  console.log(`\n${failed} sheet(s) changed. If the change is intended, run with --update and log it in brand/CHANGELOG.md.`);
  process.exit(1);
}
