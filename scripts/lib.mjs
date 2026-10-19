// Shared helpers for the OpenRouter audio scripts.
import { readFileSync, existsSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const readJson = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
export const writeJson = (p, v) => writeFileSync(join(root, p), JSON.stringify(v, null, 2) + "\n");

// Which advisory: `--ep advisories/0002-robot-vacuum` (or `--ep 0002`), or EP=..., else
// the newest folder in advisories/. The flag is removed from process.argv so scripts can
// keep using positional arguments.
function pickEpisode() {
  const i = process.argv.indexOf("--ep");
  let v = process.env.EP;
  if (i >= 0) {
    v = process.argv[i + 1];
    process.argv.splice(i, 2);
  }
  const all = readdirSync(join(root, "advisories")).filter((d) => /^\d{4}-/.test(d)).sort();
  if (!v) v = all.at(-1);
  v = v.replace(/^advisories\//, "").replace(/\/$/, "");
  const slug = all.find((d) => d === v || d.startsWith(`${v}-`));
  if (!slug) throw new Error(`No advisory folder for "${v}" in advisories/ (have: ${all.join(", ")})`);
  return slug;
}
export const slug = pickEpisode();
export const epId = slug.slice(0, 4);
export const EP = `advisories/${slug}`; // episode folder, relative to root
export const ep = (p) => `${EP}/${p}`; // path inside the episode folder
export const PUBLIC_LINES = `video/public/episodes/${slug}/lines`;

export const scenes = readJson(ep("scenes.json"));
export const audio = readJson("brand/audio.json");
export const voiceConfig = readJson("brand/voice.json");
export const lineById = Object.fromEntries(scenes.lines.map((l) => [l.id, l]));

// The key comes from .env when present. Never print it. In environments where a
// proxy injects credentials, requests are sent without an Authorization header.
function apiKey() {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return null;
  const m = readFileSync(envPath, "utf8").match(/^\s*OPENROUTER_API_KEY\s*=\s*"?([^"\n]+)"?/m);
  return m ? m[1].trim() : null;
}

export function headers() {
  const key = apiKey();
  return { "Content-Type": "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}) };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function withRetry(fn, tries = 4) {
  let err;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn(i);
    } catch (e) {
      err = e;
      if (e.fatal) break;
      await sleep(1500 * 2 ** i);
    }
  }
  throw err;
}

// The narrator's slip lines are per episode (scenes.json meta.slipLines).
export const slipLines = scenes.meta?.slipLines ?? audio.voice.slipLines ?? [];

export function instructionsFor(lineId) {
  return slipLines.includes(lineId)
    ? `${audio.voice.instructions} ${audio.voice.slipInstructions}`
    : audio.voice.instructions;
}

// One TTS request. `model` defaults to voice-config.json. Gemini only returns raw
// PCM; other providers return MP3. Returns { audio, format, rate, channels, generationId, status }.
export async function speak(text, voice, instructions, model = voiceConfig.model) {
  const isGemini = model.startsWith("google/");
  const res = await fetch("https://openrouter.ai/api/v1/audio/speech", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model,
      input: text,
      voice,
      ...(instructions ? { instructions } : {}),
      response_format: isGemini ? "pcm" : "mp3",
    }),
  });
  const generationId = res.headers.get("x-generation-id");
  if (!res.ok) {
    const body = await res.text();
    const e = new Error(`TTS ${res.status}: ${body.slice(0, 300)}`);
    e.fatal = res.status === 400 || res.status === 401 || res.status === 402;
    e.status = res.status;
    throw e;
  }
  const type = res.headers.get("content-type") || "";
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 4800) throw new Error(`TTS returned only ${buf.length} bytes`);
  const format = /pcm|l16|raw/i.test(type) ? "pcm" : "mp3";
  const rate = Number(type.match(/rate=(\d+)/)?.[1] ?? voiceConfig.pcm.sampleRate);
  const channels = Number(type.match(/channels=(\d+)/)?.[1] ?? 1);
  return { audio: buf, format, rate, channels, generationId, status: res.status };
}

// TTS response -> lossless 48 kHz stereo WAV master (+ optional 320k MP3).
export function audioToFiles({ audio, format, rate, channels }, wavPath, mp3Path) {
  const tmp = wavPath.replace(/\.wav$/, format === "pcm" ? ".pcm" : ".src.mp3");
  writeFileSync(tmp, audio);
  const inArgs = format === "pcm"
    ? ["-f", "s16le", "-ar", String(rate), "-ac", String(channels), "-i", tmp]
    : ["-i", tmp];
  execFileSync("ffmpeg", ["-v", "error", "-y", ...inArgs, "-af", "aresample=48000:resampler=soxr", "-ac", "2", "-c:a", "pcm_s16le", wavPath]);
  if (mp3Path) {
    if (format === "mp3") execFileSync("cp", [tmp, mp3Path]);
    else execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wavPath, "-c:a", "libmp3lame", "-b:a", "320k", mp3Path]);
  }
  execFileSync("rm", ["-f", tmp]);
}

export function duration(path) {
  return parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).toString());
}

export async function generationCost(id) {
  if (!id) return null;
  for (let i = 0; i < 6; i++) {
    const res = await fetch(`https://openrouter.ai/api/v1/generation?id=${encodeURIComponent(id)}`, { headers: headers() });
    if (res.ok) {
      const j = await res.json();
      return j.data?.total_cost ?? null;
    }
    await sleep(2000);
  }
  return null;
}

export async function keyUsage() {
  const res = await fetch("https://openrouter.ai/api/v1/key", { headers: headers() });
  if (!res.ok) throw Object.assign(new Error(`Cannot read key usage (${res.status})`), { fatal: true });
  const j = await res.json();
  if (typeof j.data?.usage !== "number") throw Object.assign(new Error("Key usage missing"), { fatal: true });
  return j.data.usage;
}

// Hard stop for the user's OpenRouter budget. <episode>/reports/budget.json holds the
// key's usage when the episode started and the allowed spend on top of it. It is created
// on the first paid call of a new advisory (cap: $2, about five times a normal episode).
export async function assertBudget() {
  const usage = await keyUsage();
  const path = ep("reports/budget.json");
  if (!existsSync(join(root, path))) {
    mkdirSync(join(root, ep("reports")), { recursive: true });
    writeJson(path, { baselineUsage: usage, maxSpendUsd: 2.0, note: "Key usage when this advisory started. Spend = usage - baselineUsage." });
  }
  const b = readJson(path);
  if (usage - b.baselineUsage > b.maxSpendUsd) {
    throw Object.assign(new Error(`Budget exceeded: spent $${(usage - b.baselineUsage).toFixed(4)}`), { fatal: true });
  }
  return usage - b.baselineUsage;
}

export async function pool(items, n, fn) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (queue.length) await fn(queue.shift());
    }),
  );
}
