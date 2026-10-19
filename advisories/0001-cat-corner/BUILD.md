# Advisory 0001: build the video

> Historical spec, kept as it was written before the build. The voice that was used in the end: MiniMax Speech 2.8 HD, voice `English_ManWithDeepVoice`, through OpenRouter as `minimax/speech-2.8-hd` (the `onyx`/gpt-4o-mini-tts options below were no longer served). For new advisories, follow the root `CLAUDE.md`.

You are building one finished YouTube video from this folder: **"If Your Cat Ever Stares At An Empty Corner… DO NOT LOOK"** for the channel *Not Covered*. The narrator is the fictional **Department of Unlisted Risks**. The video is a JavaScript animation (Remotion + React + SVG) rendered to MP4. The only AI-generated asset is the voice-over, made through OpenRouter.

Everything you need is in this folder. Do not ask the user for creative decisions; they are already made. Ask only for the API key if it is missing, and once for the voice choice (step 3).

## Files

| File | Role |
|---|---|
| `brief.md` | Concept, tone, channel identity. Read first. |
| `scenes.json` | **Source of truth.** `lines` (voice text, caption, shot, pause, emphasis, sfx, transition) and `shots` (what is on screen). |
| `style.json` | Palette, fonts, captions, HUD, cards, documents, figures, transitions, effects, thumbnail. |
| `scene-library.md` | Spec for every component and element used in `scenes.json`. |
| `audio.json` | Voice (TTS), verification (STT), timing formula, drone bed, sound effects, mastering. |
| `script.md` | Human-readable script (mirror of `scenes.json`). |
| `metadata.md` | Title, description, tags, pinned comment; chapters are filled in by you in step 9. |

Never change the wording of `voice` or `caption`. If something in the script looks wrong, report it instead of fixing it.

## Requirements

- Node 18+ and ffmpeg/ffprobe on PATH. Check first; tell the user what is missing.
- `OPENROUTER_API_KEY` in `.env` at the folder root. If missing, ask the user to add it. Never print, log or commit the key. Add `.env` to `.gitignore`.

## Steps

1. **Scaffold.** Create a Remotion 4 TypeScript project in `video/` (blank template). Add `@remotion/google-fonts` and `@remotion/media-utils`. Copy `scenes.json` to `video/src/data/scenes.json` (or import it with a relative path). Create `scripts/` (Node ESM, no extra framework), `audio/lines/`, `audio/sfx/`, `audio/voice-tests/`, `reports/`, `out/`.
2. **Sound effects and bed.** Run the ffmpeg recipes in `audio.json` → `bed` and `sfx` to create `audio/sfx/*.wav`. Put them where Remotion can load them (`video/public/sfx/`).
3. **Voice test.** `scripts/voice-test.mjs`: for each voice in `audio.json → voice.voiceCandidates`, generate lines L001, L018, L073 into `audio/voice-tests/`. Ask the user once which voice to use (list the file paths). No answer → `onyx`.
4. **Voice-over.** `scripts/tts.mjs`: one request per line to `POST https://openrouter.ai/api/v1/audio/speech` with the model, voice, `instructions` (use `slipInstructions` for lines in `slipLines`) and `response_format: "mp3"` from `audio.json`. Save `audio/lines/<id>.mp3`. Skip existing files, concurrency 4, retry with backoff. Log status, bytes and `X-Generation-Id` per line in `reports/tts-log.json`.
5. **Verify.** `scripts/stt-check.mjs`: transcribe each line with `POST https://openrouter.ai/api/v1/audio/transcriptions` (`verbose_json`, word timestamps). Compute word error rate against the `voice` text (normalised). WER > 0.15 → regenerate that line (max 2 extra tries). Use the word timestamps to trim leading/trailing silence over 0.15 s (ffmpeg `atrim`). Write `reports/stt-check.json`. Copy final line files to `video/public/lines/`.
6. **Timings.** `scripts/timings.mjs`: measure every final line with ffprobe and apply the formula in `audio.json → timing`. Write `video/src/data/timings.json`. Total runtime must land in 4:45–5:30 including the 3 s end card; if not, scale only the `pauseAfter` values and report the factor.
7. **Build the visuals.** Implement the components in `scene-library.md` with the tokens in `style.json`, then the `Video` composition (1920×1080, 30 fps, duration from `timings.json` via `calculateMetadata`). Per line: a `<Sequence>` from its start frame to the next line's start frame showing its shot (resolve `same_as`, `add`, `hold`), the caption, the HUD, the line audio, and its sfx. Global layers: drone bed with the silence ducking from `audio.json`, grain, vignette.
   - Then render **one still per shot** (middle frame of the first line that uses it) to `out/review/<shotId>.png` and build a contact sheet `out/review/contact-sheet.png` (ffmpeg tile, 6 columns). Look at the stills yourself. Check each against its `desc`: correct elements, readable at a glance, nothing overlapping the caption zone, consistent figure style. Fix and re-render the stills that fail. Do this before polishing motion.
8. **Render.** `npx remotion render` → `out/advisory-0001-cat-corner.mp4` (H.264, AAC 48 kHz). Then apply the loudness pass from `audio.json → master` → `out/advisory-0001-cat-corner-final.mp4`.
9. **Thumbnail and metadata.** Add a `Thumbnail` still composition (1280×720, `style.json → thumbnail`) and render `out/thumbnail.png`. Fill in the chapter timestamps in `metadata.md` from `timings.json` (first line of each beat; first chapter must be 0:00).
10. **Report.** Finish with a short report: final runtime, voice used, lines regenerated after the STT check, any pause scaling, total OpenRouter cost if the responses report it, and the output file paths.

## Done when

- [ ] `out/advisory-0001-cat-corner-final.mp4` exists: 1920×1080, 30 fps, 4:45–5:30, loudness −14 LUFS ±1.
- [ ] Every line is audible, in order, with its caption shown for exactly its duration, emphasis words coloured.
- [ ] All 104 lines pass the STT check (or are listed in the report as accepted after 3 attempts).
- [ ] Every shot matches its `desc`; the contact sheet has been reviewed and is saved.
- [ ] HUD progress follows the directives; directive cards land with the stamp sound.
- [ ] The slip (L070–L072) is visibly grey and different. The inspector appears only as a faint hint before the slip, in grey during the slip, and clearly from the addendum (L094) onward.
- [ ] `out/thumbnail.png` (1280×720) and a completed `metadata.md`.

## Do not

- Do not generate images or video with AI models; everything visual is drawn in code.
- Do not use real brands, logos or real people.
- Do not imitate the channel Bradikinin: no "trusted government agency" phrasing, no FILE-number HUD, no sunglasses agent, no yellow/white/red pictogram palette with yellow accent. Our identity is in `style.json`.
- Do not change the script text, the shot order or the channel/department names.
