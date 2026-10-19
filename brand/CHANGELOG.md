# Brand and kit changelog

Every change to `brand/` or to the shared kit (`video/src/` outside `episodes/`) gets a line here. When the reference sheets change, say why. Versions follow `catalog.json → kitVersion`.

## 1.1.0 (before Advisory 0002)

Removed the last Advisory 0001 values from the shared kit, so later advisories can't trip over them. Advisory 0001 renders pixel-identically (frames 2526, 3539, 4683, 4847, 6468, 6562 compared).

- Counter backdrops are opt-in through `decor` (`folder-stack`, `redacted-list`, `dots-grid`) and `x`, instead of being tied to 0001's shot ids S47/S48/S66.
- Floor plan caption comes from `plan.caption` (it always said "CASE 0411").
- Calendar years and page header come from `fromYear`, `toYear` and `pageLabel` (it always ran 2015–2026 with "EVENING").
- Any element can set `z` to choose its draw layer (episode-specific elements default to 0).
- `validate.mjs` follows chained `same_as` references and checks counter `decor`.
- Advisory 0001's scenes.json carries the values it used to get from the kit.

## 1.0.0 (Advisory 0001 → studio)

Extracted from the first published video, "If Your Cat Ever Stares At An Empty Corner… DO NOT LOOK".

- The repo is now a multi-advisory studio. The channel lives in `brand/`, each video in `advisories/NNNN-topic/`, and per-episode code in `video/src/episodes/NNNN-topic/`.
- Episode engine (`video/src/engine.ts`): `createEpisode()` turns scenes, timings, patches and assets into segments. Advisory number, end-card stamp and HUD text come from the episode, not hard-coded "0001".
- Episode-specific assets: `meta.customElements` / `meta.customShots` plus `assets.tsx`, rendered through `EpisodeAssetsContext`.
- Golden reference sheets in `brand/reference/` (characters, props, layout, cards), rendered from the real kit at one shared scale. `scripts/check-reference.mjs` fails when the kit drifts (SSIM < 0.995).
- `brand/catalog.json` and `scripts/validate.mjs` check a script against the kit before any voice money is spent.
- `scripts/new-advisory.mjs` scaffolds the next advisory. `timings.mjs --estimate` previews it before any voice exists.
- Voice locked: `minimax/speech-2.8-hd` · `English_ManWithDeepVoice`. Slip lines move to `scenes.json → meta.slipLines`. Mastering is -14 LUFS, TP -2.0.
- Label annotation text is 24 px (it was 16 px in the original spec).
- Advisory 0001 data fix: the L006 emphasis "six directives" never matched its caption "6 directives", so the highlight was missing in the published video. Fixed in the data. The published video is unchanged.
- The refactor renders Advisory 0001 pixel-identically (frames 435, 1425, 1500, 4200, 7000, 8955 compared with the original code).
