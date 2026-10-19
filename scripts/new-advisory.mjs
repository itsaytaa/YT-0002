// Scaffolds a new advisory from brand/templates/new-advisory/.
//   node scripts/new-advisory.mjs 0002 robot-vacuum "If Your Robot Vacuum Ever Stops Under The Bed… DO NOT CHECK"
// Creates advisories/<slug>/ (brief, script, scenes skeleton, metadata), the episode's
// code folder video/src/episodes/<slug>/, registers it in video/src/episodes/index.ts and
// writes estimated timings so it opens in Remotion Studio straight away (silent until the
// voice is generated).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [id, topic, title = "TODO: title"] = process.argv.slice(2);
if (!/^\d{4}$/.test(id ?? "") || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(topic ?? "")) {
  console.error('Usage: node scripts/new-advisory.mjs <NNNN> <topic-in-kebab-case> ["Title"]');
  process.exit(1);
}
const slug = `${id}-${topic}`;
const taken = readdirSync(join(root, "advisories")).find((d) => d.startsWith(`${id}-`));
if (taken) {
  console.error(`Advisory ${id} already exists: advisories/${taken}`);
  process.exit(1);
}

const DIGITS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const vars = {
  ID: id,
  SLUG: slug,
  TITLE: title,
  NEXT: String(Number(id) + 1).padStart(4, "0"),
  ID_VOICE: [...id].map((d) => DIGITS[+d]).join(" "),
};
const fill = (s, json) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => (json ? JSON.stringify(vars[k]).slice(1, -1) : vars[k]));

const tpl = join(root, "brand/templates/new-advisory");
const write = (from, to) => {
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, fill(readFileSync(from, "utf8"), from.endsWith(".json")));
  console.log(`created  ${to.slice(root.length + 1)}`);
};

const epDir = join(root, "advisories", slug);
for (const f of ["brief.md", "script.md", "scenes.json", "metadata.md"]) write(join(tpl, f), join(epDir, f));
for (const d of ["audio/lines", "reports", "out/review"]) mkdirSync(join(epDir, d), { recursive: true });
mkdirSync(join(root, "video/public/episodes", slug, "lines"), { recursive: true });

const codeDir = join(root, "video/src/episodes", slug);
for (const f of ["index.ts", "patches.ts", "assets.tsx", "Thumbnail.tsx"]) write(join(tpl, "video", f), join(codeDir, f));

// Register in the episode index.
const indexPath = join(root, "video/src/episodes/index.ts");
let index = readFileSync(indexPath, "utf8");
const alias = `ep${id}`;
index = index.replace(/(import \* as ep\d{4} from "[^"]+";\n)(?!import \* as ep)/, `$1import * as ${alias} from "./${slug}";\n`);
index = index.replace(/(\n  "\d{4}": \{ episode: ep\d{4}\.episode, Thumbnail: ep\d{4}\.Thumbnail \},\n)(?!  ")/, `$1  "${id}": { episode: ${alias}.episode, Thumbnail: ${alias}.Thumbnail },\n`);
if (!index.includes(`./${slug}`) || !index.includes(`"${id}": {`)) throw new Error("Could not register the advisory in video/src/episodes/index.ts; add it by hand.");
writeFileSync(indexPath, index);
console.log("updated  video/src/episodes/index.ts");

execFileSync(process.execPath, [join(root, "scripts/timings.mjs"), "--ep", slug, "--estimate"], { stdio: "inherit" });

console.log(`
Advisory ${id} is scaffolded. Next:
  1. Write advisories/${slug}/brief.md and script.md (rules: brand/BRAND.md).
  2. Grow scenes.json from the skeleton; check it with  node scripts/validate.mjs --ep ${id}
  3. Preview for free:  node scripts/timings.mjs --ep ${id} --estimate  then  cd video && npx remotion studio  (Advisory-${id})
  4. Voice:  tts.mjs, stt-check.mjs, timings.mjs  (all with --ep ${id}); see CLAUDE.md.`);
