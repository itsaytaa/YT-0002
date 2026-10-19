# Not Covered: studio

This repo makes the YouTube channel **Not Covered**. Each video is an **Advisory** from the fictional **Department of Unlisted Risks**: a five-minute "rules horror" pictogram video drawn in code with Remotion (React + SVG) and rendered to MP4. The only AI-generated asset is the voice-over (OpenRouter TTS, checked with OpenRouter STT). All content is English.

## Layout

```
brand/                      the channel. Shared by every advisory; never changed for one episode.
  BRAND.md                  identity, advisory formula, characters, layout, rules for new assets  ← read first
  style.json audio.json     visual and audio tokens (voice is locked in voice.json)
  catalog.json              what the kit can draw (validate.mjs checks scenes.json against it)
  scene-library.md          what each element / pose / shot type looks like
  reference/*.png           golden images: characters, props, layout, cards
  templates/new-advisory/   skeleton files for the next advisory
  CHANGELOG.md              every change to the kit or the brand
advisories/NNNN-topic/      one folder per video: brief, script, scenes.json, timings.json,
                            metadata.md, audio/, reports/, out/
video/src/                  the shared kit (engine, figures, shots, overlays, sheets)
video/src/episodes/NNNN-topic/
                            the only per-episode code: index.ts (wiring), patches.ts
                            (corrections), assets.tsx (episode-only assets), Thumbnail.tsx
scripts/                    pipeline; every script takes --ep NNNN (default: newest advisory)
```

## Make a new advisory

1. **Scaffold:** `node scripts/new-advisory.mjs 0002 robot-vacuum "If Your Robot Vacuum Ever… DO NOT …"`. This creates both folders, registers the episode and writes estimated timings.
2. **Write.** Read `brand/BRAND.md`, then fill in `brief.md` → `script.md` → `scenes.json`. Follow the advisory formula: cold open, teaser, world, six directives, addendum, callback, outro; 600–760 words; one slip line listed in `meta.slipLines`. Build shots from the kit vocabulary in `brand/catalog.json`, with the look in `brand/reference/*.png`.
3. **Validate:** `node scripts/validate.mjs --ep 0002`. Fix every ERROR. Warnings are judgement calls.
4. **Preview for free:** `node scripts/timings.mjs --ep 0002 --estimate`, then `cd video && npx remotion studio` → `Advisory-0002`. Iterate on scenes.json until every shot reads well. `node scripts/review-stills.mjs --ep 0002` gives one still per shot plus a contact sheet.
5. **Voice** (costs money; the budget guard writes `reports/budget.json` with a $2 cap on first use):
   `node scripts/tts.mjs --ep 0002` → `node scripts/stt-check.mjs --ep 0002` → `node scripts/timings.mjs --ep 0002`.
   The voice is locked: MiniMax Speech 2.8 HD, voice `English_ManWithDeepVoice`, through OpenRouter as `minimax/speech-2.8-hd` (`brand/voice.json → chosen`). Do not run a voice test for a normal episode.
6. **Review:** `node scripts/review-stills.mjs --ep 0002`, then look at the contact sheet. Fix layout issues in scenes.json. After the voice is locked, use `patches.ts` for corrections.
7. **Render and master:**
   ```sh
   cd video && npx remotion render Advisory-0002 ../advisories/0002-robot-vacuum/out/advisory-0002.mp4 --codec=h264 --crf=16 --audio-codec=aac --audio-bitrate=320k
   cd ../advisories/0002-robot-vacuum/out && ffmpeg -i advisory-0002.mp4 -af "loudnorm=I=-14:TP=-2.0:LRA=11,aresample=48000" -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart advisory-0002-final.mp4
   ```
   Aim for -14 LUFS and at most -1.0 dBTP (check with `ffmpeg -af ebur128=peak=true`).
8. **Thumbnail and metadata:** edit `video/src/episodes/<slug>/Thumbnail.tsx`, then run `npx remotion still Thumbnail-0002 ../advisories/<slug>/out/thumbnail.png`. Then `node scripts/chapters.mjs --ep 0002` and finish `metadata.md`.
9. **Report:** write `reports/report.md` covering runtime, lines regenerated, pause scale, cost and anything that deviated from the brand.

## Rules

- **Reuse the kit first.** Characters (person, inspector, cat, crowd), props, cards, documents, HUD and captions are drawn by the kit and are never redrawn or restyled for an episode.
- **New assets are welcome** when an advisory needs something the kit can't draw. Declare it in `scenes.json → meta.customElements` / `meta.customShots`, implement it in `video/src/episodes/<slug>/assets.tsx`, and follow `brand/BRAND.md` §5. When a second advisory needs it, promote it into the kit (§6).
- **Do not edit kit files** (`video/src/` outside `episodes/`, `brand/`) for one episode. If the kit itself must change, run `node scripts/check-reference.mjs` afterwards. If the look changed on purpose, run it with `--update`, bump `kitVersion` in `catalog.json`, add a line to `brand/CHANGELOG.md`, and confirm that earlier advisories still render.
- **Before committing:** `cd video && npx tsc --noEmit`, `node scripts/validate.mjs --ep <id>` for every advisory you touched, and `node scripts/check-reference.mjs` when kit files changed.
- **Secrets:** `OPENROUTER_API_KEY` lives in `.env` (gitignored). Never print, log or commit it.
- **Rendering in a small container:** add `--concurrency=1`. If Chrome can't be downloaded, pass `--browser-executable=<chrome-headless-shell>` to Remotion, or set `REMOTION_BROWSER_EXECUTABLE` for the scripts.
- **Large files:** final MP4s (~280 MB) and regenerable WAVs are gitignored. The trimmed line WAVs in `video/public/episodes/<slug>/lines/` are committed so a video can be re-rendered without API calls.

`advisories/0001-cat-corner/BUILD.md` is the original one-off build spec for Advisory 0001. It is kept for history; this file replaces it for new work.
