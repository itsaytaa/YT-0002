# Not Covered

Studio repo for the YouTube channel **Not Covered**. It makes five-minute "rules horror" pictogram videos (Advisories from the fictional Department of Unlisted Risks), drawn in code with Remotion (React + SVG). The only AI-generated asset is the voice-over (OpenRouter).

- `brand/`: the channel's identity, the shared look and sound, and the reference sheets. Start with `brand/BRAND.md`.
- `advisories/NNNN-topic/`: one folder per video (brief, script, scenes, timings, metadata, audio, reports, outputs).
- `video/`: the Remotion project. The shared kit is in `video/src/`; per-episode wiring is in `video/src/episodes/`.
- `scripts/`: the pipeline. Every script takes `--ep NNNN`.
- `CLAUDE.md`: the step-by-step workflow for a new advisory.

| Advisory | Title | Folder |
|---|---|---|
| 0001 | If Your Cat Ever Stares At An Empty Corner… DO NOT LOOK | `advisories/0001-cat-corner/` |

## Re-render Advisory 0001

Requires Node 18+ and ffmpeg. The voice-over is already in the repo (trimmed WAVs in `video/public/episodes/0001-cat-corner/lines/`), so no API calls are needed.

```sh
node scripts/sfx.mjs                 # rebuild sound effects + drone bed (drone.wav is not committed)
cd video && npm install
npx remotion render Advisory-0001 ../advisories/0001-cat-corner/out/advisory-0001-cat-corner.mp4 --codec=h264 --crf=16 --audio-codec=aac --audio-bitrate=320k
cd ../advisories/0001-cat-corner/out && ffmpeg -i advisory-0001-cat-corner.mp4 \
  -af "volume=enable='between(t,46.30,46.60)':volume=0.79,loudnorm=I=-14:TP=-2.0:LRA=11,aresample=48000" \
  -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart advisory-0001-cat-corner-final.mp4
```

Other entry points (from `video/`):
- `npx remotion studio`: preview every advisory, plus the reference sheets (`Sheet-*`).
- `npx remotion still Thumbnail-0001 ../advisories/0001-cat-corner/out/thumbnail.png`: the thumbnail.
- `node ../scripts/review-stills.mjs --ep 0001`: one still per shot, plus the contact sheet.

## New advisory

```sh
node scripts/new-advisory.mjs 0002 robot-vacuum "If Your Robot Vacuum Ever… DO NOT …"
node scripts/validate.mjs --ep 0002            # script vs. kit, free
node scripts/timings.mjs --ep 0002 --estimate  # preview in Remotion Studio before paying for voice
node scripts/tts.mjs --ep 0002 && node scripts/stt-check.mjs --ep 0002 && node scripts/timings.mjs --ep 0002
```

See `CLAUDE.md` for the whole flow: render, master, thumbnail, chapters and report.

## Consistency checks

- `node scripts/validate.mjs --ep NNNN`: checks scenes.json against `brand/catalog.json` (structure, shots, poses, captions, emphasis, caption-zone collisions, episode assets).
- `node scripts/check-reference.mjs`: re-renders the reference sheets and compares them with `brand/reference/*.png`. Run it after any change to the shared kit.
- `cd video && npx tsc --noEmit`

## Voice

Put `OPENROUTER_API_KEY=...` in `.env` (gitignored). The channel voice is locked in `brand/voice.json` (`minimax/speech-2.8-hd`, `English_ManWithDeepVoice`). On Node 22 behind a proxy, run the scripts with `NODE_USE_ENV_PROXY=1`.
