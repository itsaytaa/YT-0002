# Advisory 0002: build report

**If Your Robot Vacuum Ever Starts Cleaning At 3 AM… DO NOT TURN ON THE LIGHT**
Built from the Advisory 0002 package by following `BUILD.md` steps 0–10.

## Result

| | |
|---|---|
| Runtime | **5:13.43** (9,403 frames at 30 fps, 1920×1080), inside the 4:45–5:30 window. The estimate was 5:09. |
| Pause scale factor | **1.0000** (the runtime was already in the window, so `pauseAfter` is unscaled) |
| Loudness (final MP4) | **−14.1 LUFS** integrated (−14.12), **−1.8 dBTP** (−1.79), LRA 3.1 LU |
| Voice | MiniMax Speech 2.8 HD, `English_ManWithDeepVoice`, via OpenRouter `minimax/speech-2.8-hd` (locked; no voice test run) |
| Lines | 100 / 100 pass the STT check (WER ≤ 0.15) |
| Lines regenerated | **L018**, once. The first take read "Something *is walk* through your home." (WER 0.333); the second take is clean. |
| OpenRouter cost | **$0.42** for the whole episode ($0.4183 = key usage − `budget.json` baseline): TTS ≈ $0.35 (`tts-log.json`: $0.3524 for the logged takes), STT $0.032 (`stt-check.json`), plus the L018 retake. The budget guard cap was $2.00 and the owner's limit was $5.00. |
| Validation | `validate.mjs --ep 0002`: 0 errors, 0 warnings · `--ep 0001`: 0 errors (the 10 warnings were already there) · `tsc --noEmit` clean · `check-reference.mjs`: all four sheets SSIM 1.0000 · Advisory 0001 still renders (a frame, a 61-frame clip with audio, and `Thumbnail-0001`, which matches the committed PNG pixel for pixel) |

STT notes: two lines pass with a non-zero WER only because of spelling. L044 has "metres" transcribed as "meters" (0.143), and L089 has "Two metres" as "2 meters" (0.083). The audio is correct in both.

## Output files

- `advisories/0002-robot-vacuum/out/advisory-0002-robot-vacuum.mp4`: the render (h264 CRF 16, AAC 320k; gitignored)
- `advisories/0002-robot-vacuum/out/advisory-0002-robot-vacuum-final.mp4`: the mastered upload file (48 kHz, faststart; gitignored)
- `advisories/0002-robot-vacuum/out/thumbnail.png`: 1280×720
- `advisories/0002-robot-vacuum/out/review/contact-sheet.png`: one still per shot, with the real voice timings
- `advisories/0002-robot-vacuum/metadata.md`: chapters filled in, starting at 0:00
- `advisories/0002-robot-vacuum/reports/asset-sheet/{Vacuum,Props,Map}.png`: the step 2 asset test sheets (every vacuum state, a 360 px person and the kit cat for scale, the props, and the map in every field combination)
- `video/public/episodes/0002-robot-vacuum/lines/L001–L100.wav`: trimmed line WAVs (committed)

## Mastering

The spec's single-pass `loudnorm` landed at −14.5 LUFS, with one −1.1 dBTP peak on the Directive 5 card stamp at 2:55.2. I mastered like this instead:

```sh
ffmpeg -i advisory-0002-robot-vacuum.mp4 -af "volume=enable='between(t,175.15,175.50)':volume=0.79,\
loudnorm=I=-14:TP=-2.0:LRA=11:measured_I=-20.93:measured_TP=-3.27:measured_LRA=3.10:measured_thresh=-32.14:offset=0.6,aresample=48000" \
  -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart advisory-0002-robot-vacuum-final.mp4
```

- **Clip-gain ride:** −2 dB on that stamp transient, as in Advisory 0001.
- **Two passes:** the second pass uses the measured values from the first, so the result lands on −14.1 LUFS instead of −14.5.

## Deviations from `scenes.json`

No `voice` or `caption` text was changed, and no directive title. All of these are layout fixes made before the voice was generated, each one so that a shot matches its `desc` or stays out of the caption zone.

| Shot | Change | Why |
|---|---|---|
| S02, S33, S50 | Phone `h` 760/780 → 640, `y` 500 → 480 | At 760–780 px centred on y = 500, the phone ran from y ≈ 110 to 890, through the HUD and into the caption zone (860–1000). It now spans y 160–800. |
| S23b | Vacuum element gets `"type": "laser"` | The kit keys element clocks on `el/x/y/type/…`. Without a key change, the vacuum's clock carries over from S23 and the laser fan can't sweep out on L024 ("…with a laser you cannot see"). The field has no other effect. |
| S34c (inherited by S34d) | Map `extraLabel: "hidden"` | The sixth room appears without its name, so S38 can type `ROOM 6` in ("The app has already named it"). |
| S43 | Map `trailFrom: "door"` | The desc says the straight blue line runs *from the bedroom door* down the hallway, so the dot starts at the door. Dots before the door are already gone. |
| S59 | Vacuum `x` 820 → 720; knock `x` 1000 → 1050 | At 820 the bumper sat 80 px inside the door face. Now it meets the door, and the ripples sit on the door instead of on the bumper. |
| S72 | Vacuum `x` 1260 → 1440; BEEP bubble to `x` 1560, tail from (1540, 700) | At 1260 the whole vacuum was hidden behind the sofa. Now only its back half shows, per the desc. Its LED is on the hidden front edge, so the red 1 Hz blink shows as red light leaking onto the floor from under the sofa. |
| S73 | Added the new vacuum (inside the box) and a `box-front` element; `box-front` added to `meta.customElements` | The kit's `box` element draws only the back flaps (the front is added only when a cat sits inside), so on its own it read as a floating lid. `box-front` renders the kit's own `BoxFront` prop; it is not a redraw. |
| S91 | Bed `x` 1000 → 977, person `x` 954 → 931 | So the headboard touches the wall of the sixth room, per the desc. |
| S96 | Inspector `x` 240 → 190 | So the faint inspector's hat no longer runs into the wall clock. |

## Deviations from `assets-spec.md`

- **Map scale and placement:** the full-frame map is at scale 1.0 (house at x 460–1460, y 196–796), not ~1.25. At 1.25 the 600-unit house would be 750 px tall and would cut through the caption zone. Zoomed maps are masked to the scene zone with a soft fade at y 108–150 and 800–842, so nothing reaches the HUD or the captions.
- **Map zoom:** the `extra` zoom is 2.4× as specified. The `living` zoom is 1.75×, because the living room at 2.4× (≈ 816 px tall) doesn't fit the scene zone. Zooms ease in over the first ~0.8 s.
- **`robot-vacuum` turn:** the spec's literal scaleX 1 → 0 → −1 collapses a round vacuum into a vertical line halfway through. Instead, the body narrows to 82 % while the bumper seam, sensor window, LED and turret swing across it on a cosine, and halfway through it faces the camera. Same timing (0.5 s, easeInOut). The pause "look" (scaleX 1 → 0.85 → 1) is as specified.
- **Body corners:** 0.09·w horizontal radius as specified, but 0.06·w vertical. Circular 0.09·w corners on a 0.2·w-tall body made it read as a pill rather than a puck.
- **Dock:** the dock and vacuum share the same `x` in every shot, and the spec calls it a back plate with a lip at the front. So the dock is drawn as a plate standing behind the vacuum, which sits on the lip in front of it, raised 4 px.
- **Map header flip:** S34d shows `5 ROOMS` for 0.4 s, then flickers to the red `6 ROOMS` ("the header count flips"). In S80 the header reads `NEW DEVICE · CLEANING` until the sixth room appears, then flips to `6 ROOMS`, so the reveal isn't given away at the start of the line.
- **Small additions inside the specified look:**
  - The `dims: true` map adds per-room segment dimensions (4.0 / 1.7 / 4.3 m, 3.4 / 2.6 m) next to the 6.0 m side and a `10.0 × 6.0 m` total.
  - The phone's map screen has a run-stats row (area, time, battery).
  - The schedule screen has an `UNSCHEDULED · 03:00` line and a faint map at the bottom.
  - The `upload` bar shows a percentage.
- **Phone screen colour:** the screen fill uses `#0E1216`, which is not a palette token. The spec gives that value explicitly, so it was kept.
- **Sound:** no new sound effects. The knocks stay silent on purpose.

## Deviations from `brand/BRAND.md`

None. Everything new is drawn with palette tokens: figures solid `C.fg` with glow, furniture outline-on-surface, annotations 3 px blue or red. Kit characters and props are used as they are.

## Things that look wrong in the package (reported, not changed)

- **Trail crosses the bed:** in the map geometry, the second trail point (930, 470) is described as "beside the bed", but it lies inside the bed rectangle (810–990 × 380–580). On the map the trail therefore crosses the head of the bed. I kept the specified coordinates; it reads as "it walked past your pillow".
- **Stale slip note:** `brand/voice.json → chosen.slipTreatment` still names L070 (Advisory 0001's slip line). The scripts correctly use `meta.slipLines` (L066), so nothing is affected.

## Kit issues (not fixed: kit changes need the owner)

- **`scripts/sfx.mjs` fails out of the box:** every recipe in `brand/audio.json` writes to `audio/sfx/*.wav`, a folder that doesn't exist, while the script copies from `brand/sfx/`. I generated only the drone bed, with the same recipe, into `brand/sfx/drone.wav` (gitignored) and `video/public/sfx/`. The committed SFX WAVs were not regenerated, because their noise sources are random. Fix: point the recipe outputs at `brand/sfx/`.
- **`box` has no standalone front:** the kit `box` needs a front variant for use without a cat. Advisory 0002 works around it with `box-front` (S73).
- **`same_as` drops `map` fields:** the engine replaces a custom shot's own fields wholesale on `same_as` (it merges only `doc` and `plan`). `vacuum-map` resolves its own `same_as` chain from `scenes.json`. A generic merge for custom shot fields would belong in `engine.ts`.
- **No line clock for custom elements:** a custom element gets no "frames since this line started" on holds (the kit's `newAnims`). This is why S23b needed the `type` key change.
- **Promotion candidates:** as `assets-spec.md` predicts, `robot-vacuum`, `phone` and `wall` are good candidates for the kit (`BRAND.md` §6) if a smart-home advisory comes next.

## Process notes

- **Repository and branch:** the studio template (`itsaytaa/YT-Notcovered-Template`, kit 1.1.0) was seeded into `itsaytaa/YT-0002` with its history. The work is on the session's designated branch, `claude/serene-curie-ead14e`, instead of `advisory/0002-robot-vacuum`.
- **Rendering:** I used a local `chrome-headless-shell` (`--browser-executable`), with concurrency 3.
- **Motion check:** Remotion Studio can't be opened in this headless container. In its place I checked motion with frame strips through the moving shots:
  - the vacuum drives, and the trail erasing in sync with the vacuum (S05, S19, S94)
  - the stops and the turn (S44, S52)
  - the bumps and knocks (S59, S61b, S65)
  - the map sequences (S11, S43, S53, S78, S80)
  - the zooms (S38, S89)
  - the slip from L065 to L068
- **Slip:** L066 has the grey frame, the `slip` transition and the post treatment from `stt-check.mjs` (−3.5 dB, low shelf, high cut).
- **Inspector:** a faint hint at 10–16 % opacity in S45, S46b and S96, and greyscale in the slip. It is fully visible in S91 and S91b.
- **Full watch-through:** I sampled the mastered file every 2.5 s, end to end; I couldn't listen to it in this container.
- **Asset test sheet:** the step 2 test sheet was a temporary composition with its own entry point (`video/src/episodes/0002-robot-vacuum/sheet/`), never registered in the shared Root. It was removed after review; its renders are kept in `reports/asset-sheet/`.
