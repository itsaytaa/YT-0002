// Step 2: build the drone bed and sound effects from the ffmpeg recipes in audio.json.
import { execSync } from "node:child_process";
import { readFileSync, copyFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const audio = JSON.parse(readFileSync(join(root, "brand/audio.json"), "utf8"));
const recipes = { drone: audio.bed.recipe, ...audio.sfx.recipes };

mkdirSync(join(root, "brand/sfx"), { recursive: true });
mkdirSync(join(root, "video/public/sfx"), { recursive: true });
for (const [name, cmd] of Object.entries(recipes)) {
  execSync(cmd.replace(/^ffmpeg /, "ffmpeg -v error "), { cwd: root, stdio: "inherit" });
  copyFileSync(join(root, `brand/sfx/${name}.wav`), join(root, `video/public/sfx/${name}.wav`));
  console.log(`ok ${name}`);
}
