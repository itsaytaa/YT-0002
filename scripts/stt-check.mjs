// Step 5: transcribe every line, compare with the script (WER), regenerate bad lines,
// trim leading/trailing silence, and copy the final files to video/public/lines/.
import { existsSync, mkdirSync, readFileSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { root, ep, slug, PUBLIC_LINES, readJson, writeJson, scenes, audio, headers, withRetry, assertBudget, duration, generationCost, sleep, slipLines } from "./lib.mjs";
import { wer } from "./normalize.mjs";

const MAX_WER = 0.15;
const EXTRA_TRIES = 2;
const PAD = 0.15; // silence kept before the first and after the last word
const finalDir = join(root, ep("audio/lines/final"));
const publicDir = join(root, PUBLIC_LINES);
mkdirSync(finalDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });

const reportPath = ep("reports/stt-check.json");
const report = existsSync(join(root, reportPath)) ? readJson(reportPath) : { model: audio.verification.model, maxWer: MAX_WER, lines: {} };

async function transcribe(file, model = audio.verification.model) {
  const res = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model,
      input_audio: { data: readFileSync(file).toString("base64"), format: "mp3" },
      language: "en",
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
    }),
  });
  if (!res.ok) throw Object.assign(new Error(`STT ${res.status}: ${(await res.text()).slice(0, 200)}`), { status: res.status });
  return { ...(await res.json()), generationId: res.headers.get("x-generation-id") };
}

// Energy-based speech bounds, used as a guard so a word-timestamp error never clips speech.
function energyBounds(wav) {
  const raw = execFileSync("ffmpeg", ["-v", "error", "-i", wav, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], { maxBuffer: 1 << 28 });
  const s = new Int16Array(raw.buffer, raw.byteOffset, raw.length >> 1);
  const win = 160, thr = 32768 * 10 ** (-42 / 20);
  let first = -1, last = -1;
  for (let i = 0; i + win <= s.length; i += win) {
    let e = 0;
    for (let j = i; j < i + win; j++) e += s[j] * s[j];
    if (Math.sqrt(e / win) > thr) {
      if (first < 0) first = i;
      last = i + win;
    }
  }
  return { start: first / 16000, end: last / 16000 };
}

function finalize(id, words) {
  const src = join(root, ep(`audio/lines/${id}.wav`));
  const total = duration(src);
  const eb = energyBounds(src);
  const wStart = words.length ? words[0].start : eb.start;
  const wEnd = words.length ? words[words.length - 1].end : eb.end;
  const start = Math.max(0, Math.min(wStart, eb.start) - PAD);
  const end = Math.min(total, Math.max(wEnd, eb.end) + PAD);
  const filters = [`atrim=start=${start.toFixed(3)}:end=${end.toFixed(3)}`, "asetpts=PTS-STARTPTS", "afade=t=in:d=0.005", `afade=t=out:st=${(end - start - 0.03).toFixed(3)}:d=0.03`];
  // Slip line: MiniMax ignores `instructions`, so the warmer/quieter delivery is done here.
  if (slipLines.includes(id)) filters.push("lowshelf=f=220:g=2", "highshelf=f=5000:g=-3", "volume=-3.5dB");
  const out = join(finalDir, `${id}.wav`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-af", filters.join(","), "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", out]);
  copyFileSync(out, join(publicDir, `${id}.wav`));
  return { trimStart: +start.toFixed(3), trimEnd: +end.toFixed(3), rawSec: +total.toFixed(3), finalSec: +duration(out).toFixed(3), wordStart: wStart, wordEnd: wEnd, energyStart: eb.start, energyEnd: eb.end };
}

const only = process.argv.slice(2);
const lines = scenes.lines.filter((l) => !only.length || only.includes(l.id));
await assertBudget();

let i = 0;
for (const line of lines) {
  const prev = report.lines[line.id];
  if (!only.length && prev?.pass != null && existsSync(join(publicDir, `${line.id}.wav`))) continue;
  const entry = { attempts: prev?.attempts ?? [] };
  for (let attempt = 0; attempt <= EXTRA_TRIES; attempt++) {
    if (attempt > 0) {
      await assertBudget();
      execFileSync("node", [join(root, "scripts/tts.mjs"), "--ep", slug, line.id], { stdio: "ignore", env: process.env });
      entry.regenerated = (entry.regenerated ?? 0) + 1;
    }
    const t = await withRetry(() => transcribe(join(root, ep(`audio/lines/${line.id}.mp3`))), 4);
    const score = wer(line.voice, t.text);
    entry.attempts.push({ transcript: t.text.trim(), wer: +score.toFixed(3), generationId: t.generationId });
    entry.words = t.words ?? [];
    entry.wer = +score.toFixed(3);
    entry.transcript = t.text.trim();
    entry.pass = score <= MAX_WER;
    if (entry.pass) break;
  }
  entry.acceptedAfterMaxAttempts = !entry.pass;
  Object.assign(entry, finalize(line.id, entry.words));
  delete entry.words;
  report.lines[line.id] = entry;
  writeJson(reportPath, report);
  console.log(`${String(++i).padStart(3)} ${line.id} WER ${entry.wer.toFixed(2)} ${entry.pass ? "ok" : "FAIL"} ${entry.regenerated ? `(regenerated ${entry.regenerated}x)` : ""} ${entry.finalSec}s  "${entry.transcript}"`);
}

for (const e of Object.values(report.lines))
  for (const a of e.attempts) if (a.generationId && a.cost == null) a.cost = await generationCost(a.generationId);
report.totalCost = Object.values(report.lines).reduce((s, e) => s + e.attempts.reduce((t, a) => t + (a.cost ?? 0), 0), 0);
report.summary = {
  lines: Object.keys(report.lines).length,
  passed: Object.values(report.lines).filter((e) => e.pass).length,
  regenerated: Object.entries(report.lines).filter(([, e]) => e.regenerated).map(([id, e]) => ({ id, times: e.regenerated })),
  acceptedAfterMaxAttempts: Object.entries(report.lines).filter(([, e]) => e.acceptedAfterMaxAttempts).map(([id]) => id),
};
writeJson(reportPath, report);
console.log(JSON.stringify(report.summary));
console.log(`spent so far (whole project): $${(await assertBudget()).toFixed(4)}`);
