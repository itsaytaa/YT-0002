// Step 3: render the voice-test lines for every candidate voice, plus one
// comparison reel per voice (the three lines back to back).
import { existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { root, ep, audio, voiceConfig, lineById, speak, audioToFiles, instructionsFor, withRetry, assertBudget, pool } from "./lib.mjs";

const outDir = join(root, ep("audio/voice-tests"));
mkdirSync(outDir, { recursive: true });
await assertBudget();

const failed = [];
await pool(voiceConfig.voiceCandidates, 4, async ({ label, model, voice }) => {
  const reel = join(outDir, `compare-${label}.mp3`);
  if (existsSync(reel)) return;
  const wavs = [];
  try {
    for (const id of audio.voice.voiceTest.lines) {
      const mp3 = join(outDir, `${label}-${id}.mp3`);
      const wav = join(outDir, `${label}-${id}.wav`);
      const res = await withRetry(() => speak(lineById[id].voice, voice, instructionsFor(id), model), 3);
      audioToFiles(res, wav, mp3);
      wavs.push(wav);
    }
    const filter = "[0]apad=pad_dur=0.9[a];[1]apad=pad_dur=0.9[b];[a][b][2]concat=n=3:v=0:a=1";
    execFileSync("ffmpeg", ["-v", "error", "-y", ...wavs.flatMap((w) => ["-i", w]), "-filter_complex", filter, "-c:a", "libmp3lame", "-b:a", "256k", reel]);
    console.log(`ok ${label}`);
  } catch (e) {
    failed.push(label);
    console.log(`FAILED ${label}: ${e.message}`);
  } finally {
    execFileSync("rm", ["-f", ...wavs]);
  }
});
if (failed.length) console.log(`failed: ${failed.join(", ")}`);
console.log(`spent so far: $${(await assertBudget()).toFixed(4)}`);
