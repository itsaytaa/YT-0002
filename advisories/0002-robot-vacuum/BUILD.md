# Advisory 0002: build the video

You are building one finished YouTube video for the channel **Not Covered**: **"If Your Robot Vacuum Ever Starts Cleaning At 3 AM… DO NOT TURN ON THE LIGHT"**. The narrator is the fictional **Department of Unlisted Risks**. The video is drawn in code with the channel kit (Remotion + React + SVG) and rendered to MP4. The only AI-generated asset is the voice-over (OpenRouter).

The creative decisions are made. Don't ask the owner for any, and never change the wording of a line's `voice` or `caption`. If something in the script looks wrong, report it in the build report instead of fixing it. The only thing to ask for is `OPENROUTER_API_KEY` if `.env` doesn't have it.

## What's in this package

| File | Role |
|---|---|
| `BUILD.md` | These instructions. |
| `brief.md` | Story logic, directives, continuity with Advisory 0001, the asset list. |
| `scenes.json` | **Source of truth.** 100 lines (voice text, caption, shot, pause, emphasis, sfx, transition) and 93 shots. It validates against the kit, apart from the episode assets you build. |
| `script.md` | Read-through version of `scenes.json`. |
| `assets-spec.md` | Exact spec for the six new elements and one new shot type this episode needs. |
| `metadata.md` | YouTube title, description, tags and pinned comment. The chapters are filled in at step 8. |
| `preview/contact-sheet.png` | One still per shot, rendered with **placeholder** assets: grey/white boxes stand in for the vacuum, map and phone. It shows the intended composition of the kit parts. It is not the look of the new assets. |

## Step 0: Set up the studio repo

```sh
git clone https://github.com/itsaytaa/YT-Notcovered-Template not-covered && cd not-covered
cd video && npm ci && cd ..
node scripts/sfx.mjs            # rebuilds the drone bed (not committed)
```

- Read `CLAUDE.md` and `brand/BRAND.md` before anything else. Use `brand/reference/*.png` for the look and `brand/catalog.json` for what the kit can draw.
- This package needs **kit 1.1.0 or later** (`brand/catalog.json → kitVersion`). It uses counter `decor`, calendar `fromYear/toYear/pageLabel` and element `z`.
- Work on a branch: `git checkout -b advisory/0002-robot-vacuum`.

## Step 1: Scaffold and drop in the package

```sh
node scripts/new-advisory.mjs 0002 robot-vacuum "If Your Robot Vacuum Ever Starts Cleaning At 3 AM… DO NOT TURN ON THE LIGHT"
```

Copy this package's `brief.md`, `script.md`, `scenes.json`, `metadata.md`, `assets-spec.md` and `BUILD.md` into `advisories/0002-robot-vacuum/`, overwriting the skeletons. Then:

```sh
node scripts/timings.mjs --ep 0002 --estimate
node scripts/validate.mjs --ep 0002
```

Expect exactly 7 errors at this point, all "custom asset … is not registered". Anything else is a problem: stop and report it.

## Step 2: Build the episode assets

1. Implement everything in `assets-spec.md` in `video/src/episodes/0002-robot-vacuum/assets.tsx`, registered under the exact names. Keep it to that one file, plus small helper files in the same folder if it gets long. **Don't edit kit files** (`video/src/` outside `episodes/`, or `brand/`).
2. Before using them in shots, build an asset test sheet: a temporary composition in the episode folder, not registered in the shared Root.
   - Show the vacuum in every state: side and facing, every light, beam, docked, stuck, grey, dim, mid-move, mid-turn, mid-bump.
   - Show the dock, the dust trail (prints, specks, scale 2.2), the phone (all three screens, plus the small size), the wall and the knocks.
   - Show the map in every field combination.
   - Stand a 360 px kit person next to the vacuum for scale. Check that the vacuum reads as the same family as the cat and person in `brand/reference/characters.png`.
3. `node scripts/validate.mjs --ep 0002` must now report 0 errors. Also run `cd video && npx tsc --noEmit`.

## Step 3: Preview for free, before any voice money

1. `node scripts/review-stills.mjs --ep 0002`, then open `advisories/0002-robot-vacuum/out/review/contact-sheet.png`.
2. Compare it with `preview/contact-sheet.png`: the kit parts should sit where they do there.
3. Fix every shot where something overlaps, crowds the caption zone (y 860–1000) or doesn't match its `desc`. **`desc` is the authority.**
4. Scrub the motion in `cd video && npx remotion studio` → `Advisory-0002`. Check the vacuum drives, the trail erasing in sync with the vacuum, the knocks, the map sequences, and the slip at L066.

## Step 4: Voice (costs money, about $0.40)

The voice is locked: **MiniMax Speech 2.8 HD, voice `English_ManWithDeepVoice`, through OpenRouter as `minimax/speech-2.8-hd`** (`brand/voice.json → chosen`). Don't run a voice test, and don't change the model.

```sh
node scripts/tts.mjs --ep 0002          # one request per line; the budget guard caps spend at $2
node scripts/stt-check.mjs --ep 0002    # WER check, re-generates bad lines, trims silence, slip treatment on L066
node scripts/timings.mjs --ep 0002      # real timings; runtime must land in 4:45–5:30 (estimate: 5:09)
```

On Node 22 behind a proxy, prefix the commands with `NODE_USE_ENV_PROXY=1`.

## Step 5: Review

1. Run `node scripts/review-stills.mjs --ep 0002` again and look at the contact sheet.
2. Watch the whole video once in Studio with sound.
3. Fix layout in `scenes.json`. Once the voice exists, timing-safe corrections can also go in `video/src/episodes/0002-robot-vacuum/patches.ts`. Never change line text.

## Step 6: Render and master

```sh
cd video && npx remotion render Advisory-0002 ../advisories/0002-robot-vacuum/out/advisory-0002-robot-vacuum.mp4 --codec=h264 --crf=16 --audio-codec=aac --audio-bitrate=320k
cd ../advisories/0002-robot-vacuum/out && ffmpeg -i advisory-0002-robot-vacuum.mp4 \
  -af "loudnorm=I=-14:TP=-2.0:LRA=11,aresample=48000" \
  -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart advisory-0002-robot-vacuum-final.mp4
```

- **Targets:** −14 LUFS integrated and at most −1.0 dBTP. Check with `ffmpeg -i …-final.mp4 -af ebur128=peak=true -f null -`.
- **If a stamp transient peaks:** ride its clip gain down 2 dB, as in Advisory 0001.
- **Small container:** add `--concurrency=1`. If Chrome can't be downloaded, pass `--browser-executable=<chrome-headless-shell>`.

## Step 7: Thumbnail

Edit `video/src/episodes/0002-robot-vacuum/Thumbnail.tsx` (1280×720, `brand/BRAND.md` §7). Reuse this episode's `robot-vacuum` and `dust-trail` components and the kit's `InspectorBody` and `Door`.

- **Scene:** the robot vacuum large in the lower left, seen from floor level, with its blue light and laser fan. A line of dusty footprints runs right toward a closed door. In front of the door stands the inspector silhouette at 25% opacity.
- **Text:** `LIGHTS OFF` in the display font, 150 px `C.fg`, with a red underline. Above it, `ADVISORY 0002` small in blue mono.
- **Finish:** a vignette stronger than in the video.

Then render it:

```sh
cd video && npx remotion still Thumbnail-0002 ../advisories/0002-robot-vacuum/out/thumbnail.png
```

## Step 8: Chapters and metadata

`node scripts/chapters.mjs --ep 0002` fills the CHAPTERS block in `metadata.md` from the real timings. Check that the first chapter is 0:00.

## Step 9: Report

Write `advisories/0002-robot-vacuum/reports/report.md` covering:
- final runtime and the pause scale factor
- lines regenerated after the STT check
- loudness and true peak
- OpenRouter cost (from `reports/tts-log.json` and the budget)
- every deviation from `scenes.json`, `assets-spec.md` or `brand/BRAND.md`, and why
- the output file paths

## Step 10: Commit

- **Before committing:** run `npx tsc --noEmit`, then `node scripts/validate.mjs --ep 0002` and `--ep 0001`. Run `node scripts/check-reference.mjs` too; it must still pass, because you didn't touch the kit.
- **What to commit:** everything except the gitignored files (the MP4s and regenerable WAVs). The trimmed line WAVs in `video/public/episodes/0002-robot-vacuum/lines/` **are** committed.
- **Where:** commit on `advisory/0002-robot-vacuum`. Push and open a pull request only when the owner asks.

## Done when

- [ ] `Advisory-0002` renders 4:45–5:30 at 1920×1080, 30 fps. The final MP4 is at −14 LUFS and ≤ −1.0 dBTP.
- [ ] Every shot matches its `desc`, nothing enters the caption zone, and all six episode elements and `vacuum-map` follow `assets-spec.md`.
- [ ] The inspector is only a faint hint until S91. In S91 it is clearly visible.
- [ ] The slip (L066 → L068) has the grey frame, the slip transition and the post treatment on L066.
- [ ] Every caption emphasis shows, and validate reports 0 errors.
- [ ] `out/thumbnail.png`, the filled-in `metadata.md` and `reports/report.md` exist.
- [ ] Advisory 0001 still renders, and `check-reference.mjs` passes.

## Do not

- Change any `voice` or `caption` text, the voice model or the directive titles.
- Redraw or restyle kit characters (person, inspector) or kit props. Use them as they are.
- Edit kit files for this episode. If something truly belongs in the kit, note it in the report instead.
- Print, log or commit `OPENROUTER_API_KEY`.
