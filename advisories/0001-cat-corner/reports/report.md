# Advisory 0001: build report

| | |
|---|---|
| Final video | `out/advisory-0001-cat-corner-final.mp4`: 1920×1080, 30 fps, H.264 (CRF 16) + AAC 48 kHz 320 kb/s |
| Runtime | **5:00.0** (9,000 frames, including the 3 s end card) |
| Loudness | **−14.5 LUFS** integrated, **−1.5 dBTP**, LRA 3.3 LU |
| Voice | **minimax/speech-2.8-hd, `English_ManWithDeepVoice`** (picked by you after two voice-test rounds) |
| Pause scaling | Unscaled runtime 4:44.8 (under 4:45), so every `pauseAfter` × **1.322** (target 5:00) |
| OpenRouter cost | **$0.52** total (voice tests $0.12 · voice-over $0.34 · STT $0.03 · alt takes/checks $0.03). Budget $5.00 |
| Thumbnail | `out/thumbnail.png` (1280×720) |
| Metadata | `metadata.md`, chapters filled from `timings.json` |
| Review | `out/review/contact-sheet.png` + `out/review/<shotId>.png` (105 shots) |

## STT check (whisper-1, WER ≤ 0.15)
- 102 of 104 lines pass.
- **Regenerated:** L014 ×2, L023 ×2, L083 ×2 plus 4 alternative takes (take 4 kept: exact on whisper-1 and whisper-large-v3).
- **Accepted after 3 attempts:**
  - L014 "Ears forward. Tail still.": whisper-1 hears "Tails still"; whisper-large-v3 and gpt-4o-transcribe transcribe it exactly.
  - L023 "Weight back. Paws together.": a homophone of "Wait back. Pause together.", which all three STT models return.
- Details: `reports/stt-check.json`, `reports/tts-log.json`.

## Deviations from the spec (and why)
- **TTS model:** `openai/gpt-4o-mini-tts-2025-12-15` (onyx/ash/echo) no longer exists on OpenRouter. I tested 24 voices across Gemini, ElevenLabs, MiniMax, Microsoft, Deepgram and Mistral (`audio/voice-tests/compare-*.mp3`). MiniMax ignores `instructions`, so the slip line L070 gets its "warmer, quieter" delivery in post (−3.5 dB, gentle low shelf and high cut).
- **Masters:** the line audio is kept as lossless WAV (`audio/lines/final/`, `video/public/lines/`) alongside the `.mp3` files.
- **Fonts** are self-hosted (official Google Fonts files in `video/public/fonts/`) instead of `@remotion/google-fonts`, because the render browser can't reach fonts.gstatic.com from this machine. They're still embedded at render time, and Archivo uses its real width axis (wdth 75).
- **Annotation labels** are 24 px instead of 16 px, so they stay readable at a glance.
- **Loudness:** the spec's `loudnorm` with TP −2.0 instead of −1.5 (the AAC encoder overshoots by about 0.3 dB), plus a −2 dB clip-gain ride on one transient (the Directive 1 stamp at 0:46.4). The result is −1.5 dBTP.
- **`desc` over structured fields** (patches in `video/src/data.ts`; `scenes.json` is unchanged):
  - S33: the person pushes the bookcase from the corner side (the spec's positions would have them pulling it).
  - S07 gets the clock from its desc; S49 the armchair; S85 the corner; S68b the window.
  - S68: the corner starts outside the frame so the pull-back reveals it.
  - S40: the stamp pulses. S91: the memo slides out.
  - Close-up corners are lifted from y=860 to y=815 to keep the inspector out of the caption zone.
  - Minor position tweaks in S09, S11, S20, S50, S84 and S87.
- **Sound additions:** one click per lamp in S27/S30, and a soft stamp sound under the REDACTED stamp in SLIP3.

## Script notes (reported, not changed)
- No wording problems found. The only inconsistencies were shot-layout ones (listed above under deviations).
