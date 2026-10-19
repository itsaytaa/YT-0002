// Step 4: one TTS request per line -> audio/lines/<id>.mp3 (+ lossless .wav master).
// Usage: node scripts/tts.mjs [L001 L002 ...]   (no ids = all lines; existing files are skipped
// unless ids are given explicitly, in which case they are regenerated).
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { root, ep, readJson, writeJson, scenes, voiceConfig, speak, audioToFiles, instructionsFor, withRetry, assertBudget, generationCost, pool } from "./lib.mjs";

const { model, voice } = voiceConfig.chosen;
const outDir = join(root, ep("audio/lines"));
mkdirSync(outDir, { recursive: true });
const logPath = ep("reports/tts-log.json");
const log = existsSync(join(root, logPath)) ? readJson(logPath) : { model, voice, lines: {} };

const forced = process.argv.slice(2);
const todo = scenes.lines.filter((l) => (forced.length ? forced.includes(l.id) : !existsSync(join(outDir, `${l.id}.mp3`))));
await assertBudget();
console.log(`${todo.length} lines to generate with ${model} / ${voice}`);

let done = 0;
await pool(todo, 4, async (line) => {
  const entry = { attempts: [] };
  try {
    const res = await withRetry(async (i) => {
      try {
        const r = await speak(line.voice, voice, instructionsFor(line.id), model);
        entry.attempts.push({ status: r.status, bytes: r.audio.length, generationId: r.generationId });
        return r;
      } catch (e) {
        entry.attempts.push({ status: e.status ?? "error", error: e.message.slice(0, 200) });
        throw e;
      }
    }, 4);
    audioToFiles(res, join(outDir, `${line.id}.wav`), join(outDir, `${line.id}.mp3`));
    Object.assign(entry, { status: res.status, bytes: res.audio.length, generationId: res.generationId, at: new Date().toISOString() });
  } catch (e) {
    entry.status = "failed";
    entry.error = e.message;
  }
  const prev = log.lines[line.id];
  entry.generations = (prev?.generations ?? 0) + 1;
  log.lines[line.id] = entry;
  done++;
  console.log(`${String(done).padStart(3)}/${todo.length} ${line.id} ${entry.status} ${entry.bytes ?? ""}`);
  if (done % 10 === 0) writeJson(logPath, log);
});

// Costs are looked up after the fact (the generation endpoint lags a few seconds).
for (const line of todo) {
  const e = log.lines[line.id];
  if (e.generationId && e.cost == null) e.cost = await generationCost(e.generationId);
}
log.totalCost = Object.values(log.lines).reduce((s, e) => s + (e.cost ?? 0), 0);
writeJson(logPath, log);
const failed = todo.filter((l) => log.lines[l.id].status === "failed").map((l) => l.id);
console.log(`failed: ${failed.length ? failed.join(", ") : "none"}`);
console.log(`spent so far (whole project): $${(await assertBudget()).toFixed(4)}`);
