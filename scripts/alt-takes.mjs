// Extra takes for a line that the STT check could not settle, scored by three STT models.
// Usage: node scripts/alt-takes.mjs L083 4
import { readFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { root, ep, voiceConfig, lineById, speak, audioToFiles, headers, assertBudget, withRetry } from "./lib.mjs";
import { wer } from "./normalize.mjs";

const [id, n = "4"] = process.argv.slice(2);
const MODELS = ["openai/whisper-1", "openai/whisper-large-v3", "openai/gpt-4o-transcribe"];
const { model, voice } = voiceConfig.chosen;

async function transcribe(file, sttModel) {
  const res = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
    method: "POST", headers: headers(),
    body: JSON.stringify({ model: sttModel, input_audio: { data: readFileSync(file).toString("base64"), format: "mp3" }, language: "en" }),
  });
  if (!res.ok) throw new Error(`STT ${res.status}`);
  return (await res.json()).text.trim();
}

await assertBudget();
const takes = [{ file: join(root, ep(`audio/lines/${id}.mp3`)), label: "current" }];
for (let i = 1; i <= Number(n); i++) {
  const mp3 = join(root, ep(`audio/lines/alt/${id}-take${i}.mp3`));
  audioToFiles(await withRetry(() => speak(lineById[id].voice, voice, null, model)), mp3.replace(/\.mp3$/, ".wav"), mp3);
  takes.push({ file: mp3, label: `take${i}` });
}
for (const t of takes) {
  t.transcripts = await Promise.all(MODELS.map((m) => withRetry(() => transcribe(t.file, m))));
  t.score = t.transcripts.reduce((s, x) => s + wer(lineById[id].voice, x), 0) / MODELS.length;
  console.log(`${t.label} mean WER ${t.score.toFixed(3)} ${JSON.stringify(t.transcripts)}`);
}
const best = takes.reduce((a, b) => (b.score < a.score ? b : a));
console.log(`best: ${best.label}`);
if (best.label !== "current") {
  copyFileSync(best.file, join(root, ep(`audio/lines/${id}.mp3`)));
  copyFileSync(best.file.replace(/\.mp3$/, ".wav"), join(root, ep(`audio/lines/${id}.wav`)));
}
console.log(`spent so far (whole project): $${(await assertBudget()).toFixed(4)}`);
