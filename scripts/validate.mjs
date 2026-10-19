// Checks an advisory's scenes.json against brand/catalog.json before any money is spent
// on voice generation. Errors stop the build; warnings are worth a look.
// Usage: node scripts/validate.mjs --ep 0002
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { root, slug, epId, scenes, readJson } from "./lib.mjs";

const cat = readJson("brand/catalog.json");
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// Episode-specific assets must be declared in scenes.json meta AND registered in
// video/src/episodes/<slug>/assets.tsx.
const assetsFile = join(root, `video/src/episodes/${slug}/assets.tsx`);
const assetsSrc = existsSync(assetsFile) ? readFileSync(assetsFile, "utf8") : "";
const customElements = scenes.meta?.customElements ?? [];
const customShots = scenes.meta?.customShots ?? [];
for (const k of [...customElements, ...customShots]) {
  if (!new RegExp(`["']?${k.replace(/[-]/g, "\\-")}["']?\\s*:`).test(assetsSrc)) err(`custom asset "${k}" is declared in meta but not registered in video/src/episodes/${slug}/assets.tsx`);
  if (cat.elements[k] || cat.shotTypes.includes(k)) warn(`custom asset "${k}" has the same name as a kit asset; reuse the kit one or rename`);
}
if (!existsSync(join(root, `video/src/episodes/${slug}/index.ts`))) err(`video/src/episodes/${slug}/index.ts is missing (copy an existing episode folder)`);

// ---- meta
const m = scenes.meta ?? {};
if (m.advisory !== epId) err(`meta.advisory is "${m.advisory}", folder says ${epId}`);
if (!m.title) err("meta.title is empty");
if (m.channel !== "Not Covered") warn(`meta.channel is "${m.channel}"`);
if (m.width !== 1920 || m.height !== 1080 || m.fps !== 30) err("meta must be 1920x1080 at 30 fps");
const endShot = m.endCard?.shot ?? "END";
if (!scenes.shots[endShot]) err(`end card shot ${endShot} is missing`);
else if (!scenes.shots[endShot].stamp) warn(`end card ${endShot} has no stamp word`);

// ---- lines
const anims = new Set(cat.anims);
const animName = (a) => (typeof a === "string" ? a : Object.keys(a)[0]);
let words = 0;
scenes.lines.forEach((l, i) => {
  const want = `L${String(i + 1).padStart(3, "0")}`;
  if (l.id !== want) err(`line ${i + 1} has id ${l.id}, expected ${want}`);
  if (!cat.beats.includes(l.beat)) err(`${l.id}: unknown beat "${l.beat}"`);
  if (!(l.directive === null || (Number.isInteger(l.directive) && l.directive >= 1 && l.directive <= 7))) err(`${l.id}: directive must be null or 1–7 (7 = addendum)`);
  if (!l.voice?.trim()) err(`${l.id}: empty voice`);
  if (!l.caption?.trim()) err(`${l.id}: empty caption`);
  if (l.caption.length > cat.limits.captionMaxChars) warn(`${l.id}: caption is ${l.caption.length} chars (max ${cat.limits.captionMaxChars}); it may need three lines`);
  for (const e of l.emphasis ?? []) if (!l.caption.toLowerCase().includes(e.toLowerCase())) err(`${l.id}: emphasis "${e}" not found in caption`);
  if (!scenes.shots[l.shot]) err(`${l.id}: shot ${l.shot} does not exist`);
  if (!cat.transitions.includes(l.transitionIn)) err(`${l.id}: unknown transition "${l.transitionIn}"`);
  if (i === 0 && l.transitionIn === "hold") err("L001 cannot be a hold");
  if (l.sfx !== null && !cat.sfx.includes(l.sfx)) err(`${l.id}: unknown sfx "${l.sfx}"`);
  if (typeof l.pauseAfter !== "number" || l.pauseAfter < 0 || l.pauseAfter > 2) err(`${l.id}: pauseAfter must be 0–2 s`);
  if (/\d/.test(l.voice)) warn(`${l.id}: voice contains digits; spell numbers out for the TTS (digits belong in caption)`);
  words += l.voice.split(/\s+/).filter(Boolean).length;
});
if (words < cat.limits.minWords || words > cat.limits.maxWords) warn(`script is ${words} words (target ${cat.limits.minWords}–${cat.limits.maxWords})`);

// ---- structure
const cards = Object.entries(scenes.shots).filter(([, s]) => s.type === "directive-card");
const ns = cards.map(([, s]) => s.n).sort();
if (JSON.stringify(ns) !== JSON.stringify([1, 2, 3, 4, 5, 6])) err(`directive cards must be n = 1..6 exactly (found ${ns.join(",") || "none"})`);
if (!Object.values(scenes.shots).some((s) => s.type === "addendum-card")) err("no addendum-card shot");
const beatsUsed = new Set(scenes.lines.map((l) => l.beat));
for (const b of cat.beats) if (!beatsUsed.has(b)) warn(`beat "${b}" has no lines`);

// ---- shots
const used = new Set(scenes.lines.map((l) => l.shot));
for (const [id, s] of Object.entries(scenes.shots)) {
  if (!used.has(id) && id !== endShot) warn(`shot ${id} is never used`);
  if (s.same_as && !scenes.shots[s.same_as]) err(`${id}: same_as ${s.same_as} does not exist`);
  // same_as can chain (S28c -> S28b -> S28): follow it to the first shot with a type.
  let type = s.type;
  for (let b = s, n = 0; !type && b?.same_as && n < 10; n++) {
    b = scenes.shots[b.same_as];
    type = b?.type;
  }
  if (!cat.shotTypes.includes(type) && !customShots.includes(type)) err(`${id}: unknown shot type "${type}"`);
  if (s.camera?.move && !cat.cameraMoves.includes(s.camera.move)) err(`${id}: unknown camera move "${s.camera.move}"`);
  if (s.accent && !cat.accents.includes(s.accent)) err(`${id}: accent must be blue or red`);
  if (s.doc?.anim && !cat.docAnims.includes(s.doc.anim)) err(`${id}: unknown doc anim "${s.doc.anim}"`);
  if (s.decor && !cat.counterDecor.includes(s.decor)) err(`${id}: unknown counter decor "${s.decor}" (${cat.counterDecor.join(", ")})`);
  if (s.plan?.anim && !cat.planAnims.includes(s.plan.anim)) err(`${id}: unknown floorplan anim "${s.plan.anim}"`);
  if (!s.desc && !["directive-card", "addendum-card", "end-card"].includes(type)) warn(`${id}: no desc (desc is the authority for the builder)`);
  for (const e of [...(s.elements ?? []), ...(s.add ?? [])]) {
    const spec = cat.elements[e.el];
    if (!spec && !customElements.includes(e.el)) {
      err(`${id}: unknown element "${e.el}" (kit: brand/catalog.json; episode assets: declare in meta.customElements)`);
      continue;
    }
    if (spec?.poses && e.pose && !spec.poses.includes(e.pose)) err(`${id}: ${e.el} pose "${e.pose}" not in ${spec.poses.join(", ")}`);
    if (spec?.variants && e.variant && !spec.variants.includes(e.variant)) err(`${id}: corner variant "${e.variant}"`);
    if (spec?.types && e.type && !spec.types.includes(e.type)) err(`${id}: mark type "${e.type}"`);
    if (spec?.sky && e.sky && !spec.sky.includes(e.sky)) err(`${id}: window sky "${e.sky}"`);
    for (const a of Array.isArray(e.anim) ? e.anim : e.anim ? [e.anim] : []) if (!anims.has(animName(a)) && spec) err(`${id}: ${e.el} anim "${animName(a)}" is not in the kit`);
    if (["person", "cat", "inspector"].includes(e.el) && typeof e.y === "number" && e.y > 830 && e.pose !== "face-close") warn(`${id}: ${e.el} stands at y=${e.y}, inside the caption zone (keep figures at ≤ 820)`);
    if (e.el === "corner" && e.y === 860) warn(`${id}: close-up corner at y=860 reaches the caption zone; use y=815`);
  }
}

for (const w of warnings) console.log(`warning  ${w}`);
for (const e of errors) console.log(`ERROR    ${e}`);
console.log(`${slug}: ${scenes.lines.length} lines, ${Object.keys(scenes.shots).length} shots, ${words} words · ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
