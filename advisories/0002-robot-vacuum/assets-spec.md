# Advisory 0002: episode assets

Advisory 0002 needs a few things the kit can't draw. Build them in `video/src/episodes/0002-robot-vacuum/assets.tsx` and register them under exactly these names. They are already declared in `scenes.json → meta.customElements / meta.customShots`, and `validate.mjs` fails until they are registered.

Everything else in this episode is drawn by the kit. Don't redraw the person, bed, door, clock, lamp, sofa, box, window, corner, inspector, cards, documents or seal.

**Style rules** (`brand/BRAND.md` §5):
- Use palette tokens from `video/src/theme.ts` only (`C.*`).
- Figures are solid `C.fg` with `filter="url(#glow)"`. Furniture-like things are outline-on-surface (`C.surface`/`C.surface2` fill, `C.line` stroke of 2–3 px, no glow). Annotations are 3 px blue or red.
- Check every asset against a 360 px person standing on the ground line (y = 780).
- Use the kit's animation helpers from `video/src/anim.ts` (`prog`, `lerp`, `ease`, `easeInOut`, `popIn`, `rand`). Nothing bounces, nothing overshoots.

**Time units used below:** `t` (frames since the element appeared) and `dur` (frames of that line) come from `CustomElementProps`. *Fraction* means a fraction of `dur`. *Seconds* means `t / fps`.

---

## Elements (tableau)

### `robot-vacuum` (figure: the episode's hero)
A round robot vacuum seen from the side. It is the thing the story is about, so it is a **solid `C.fg` figure with glow**, like the cat in Advisory 0001.

| Field | Meaning |
|---|---|
| `x`, `y` | Centre of the body; `y` is the floor (ground line). |
| `w` | Diameter in px (default 200). Height of the body ≈ 0.24·w. |
| `facing` | `left` / `right`. The front (bumper, sensor window) faces this way and it drives this way. |
| `light` | Status LED on the top front edge: `blue` (default, with a soft blue glow), `red` (with red glow), `dim` (blue at 35%), `off`. |
| `color` | `fg` (default), `dim` (old/unused: body in `C.dim`), `grey` (the slip shot, `C.grey`). |
| `beam` | `true`: a faint blue laser fan from the sensor window, low and forward along the floor (a thin wedge, `C.blue` at ~12–18%, a scan line sweeping through it every ~1.2 s). |
| `move` | `{fromX, toX, from, to, stops}`: drive from `fromX` to `toX` between line fractions `from` and `to` (easeInOut on the whole run). `x` is ignored while `move` is set. `stops: n` splits the run into n+1 legs with a pause between them. During each pause the body briefly narrows horizontally (scaleX 1 → 0.85 → 1, ~0.4 s) as if it turns to look, and the LED blinks once. |
| `turn` | `{at}`: at line fraction `at`, turn around on the spot (scaleX 1 → 0 → −1 over ~0.5 s, easeInOut) so it faces the other way. |
| `bump` | `{count, at, gap}`: `count` gentle bumps forward (6 px forward over 3 frames, back over 6), the first at `at` seconds, then every `gap` seconds. Draw two tiny `C.dim` impact strokes at the front on each bump. |
| `trail` | `{fromX, toX, scale}`: draws the **dust footprints** (see `dust-trail`) between `fromX` and `toX`, but only the part *ahead* of the vacuum's current front. The part behind it is clean. Behind the vacuum, draw a subtle clean strip on the floor (a 6 px band, `C.line`, ~25%) from where it started to its current position. |
| `docked` | `true`: sitting on its dock. It is raised 4 px, its back edge touches the dock plate. |
| `stuck` | `true`: wedged under a sofa. A small shake every ~0.8 s (2 px) and the LED blinks (1 Hz). `z: -0.6` in scenes.json puts it behind the sofa, so only its back half shows. |
| `anim: ["led-breathe"]` | LED opacity breathes 0.35 → 1 → 0.35 every 2.5 s. |

**Shape (side view, `w` = diameter, origin at floor centre):**
- **Body:** rounded rect from x −w/2 to +w/2, y −0.24w to −0.04w, corner radius 0.09w. Solid fg with glow.
- **Top:** a lidar turret 0.22w wide and 0.06w tall, centred 0.1w behind the middle (toward the back), radius 0.02w.
- **Bumper:** a 3 px `C.bg` line separating the front 18% of the body, plus a dark sensor window (`C.bg`, 0.1w × 0.035w) on the front face.
- **Wheels:** two small `C.dim` half-circles under the body (r 0.035w) at ±0.25w.
- **Side brush:** three short `C.dim` strokes under the front edge, rotating (sin-based) only while moving.
- **LED:** a circle r = 0.022w on the top front edge.

### `dock`
The charging dock, an outline-on-surface prop. `x`, `y` (floor), `w` (default 120), `led` (`blue` default / `off`).
- Draw a back plate: rounded rect `w` wide, 0.9·w tall, standing on the floor, `C.surface2` with a `C.line` 3 px stroke.
- Add a slanted base lip (0.15·w tall) at the front and two small metal contacts (`C.dim`).
- Put a tiny LED (r 4) near the top: `C.blue` with glow when `led` is `blue`, `C.line` when `off`.
- The vacuum's back edge touches the front of the plate.

### `dust-trail`
Dusty **footprints** on the floor, seen from a low side angle. The thing that walks is never shown, only what it leaves.

| Field | Meaning |
|---|---|
| `fromX`, `toX`, `y` | Where the trail starts (where it came from), where it ends, and the floor line. The prints point from `fromX` toward `toX`. |
| `scale` | Size multiplier (default 1). Use 2.2 for floor-level close-ups. |
| `kind` | `prints` (default) or `specks` (a little loose dust in a corner, no footprints). |
| `draw` | `"sequence"`: prints appear one by one from `fromX` toward `toX` over the first 70% of the line, each fading in over 4 frames. Without it they are all there from the start. |

- **Print shape:** flattened ellipses in pairs (left/right foot), 34×7 px at scale 1, `C.dim` at 55%, with 2–3 tiny speck dots around each.
- **Spacing:** 120 px per step. Alternate feet 6 px above and below the floor line.
- **Shape:** the prints are slightly too long and too narrow for a person. Don't add toes or detail.

### `phone`
A smartphone, portrait, showing the vacuum app. `x`, `y` (centre), `h` (height, default 760). The width is 0.5·h.
- **Body:** rounded rect (radius 0.07·h), `C.surface` with a `C.line` 3 px stroke. The screen is inset 0.03·h and filled `#0E1216`.
- **Light:** the screen is the only light in the room. Add a soft `C.fg` glow around the phone (radial, ~10%). When `glow` is `true` (small phone on a blanket), also add a wider soft light pool.
- **Status bar:** `time` (default `03:00`) in IBM Plex Mono, top left, `C.dim`.
- **App header:** a small blue dot plus `VACUUM` in mono, letter-spaced.

`screen` values:
- `schedule`: title `SCHEDULE`; rows `MON–FRI ..... NONE` and `SAT–SUN ..... NONE`; a big status `CLEANING` in the display font with a slowly pulsing blue dot.
- `map`: the vacuum map (see `vacuum-map`, map style), fitted to the screen width, with the `map` fields given (e.g. `{vacuum: "hall"}`); under it `CLEANING · HALLWAY`.
- `dock-button`: the map at the top; below it a big outlined button `RETURN TO DOCK` (2 px `C.blue` border, mono caps). The border pulses 60% → 100% every 1.2 s.

At small sizes (h < 300) draw only the glowing screen with a hint of the map: no text.

### `wall`
A wall in **cross-section**, for the reveal (S91) and the morning bedroom (S28). `x` (centre), `y` (floor), `h` (default 620), `thickness` (default 34).
- **Body:** a solid `C.surface2` rect from the floor up to `h`, with a `C.line` 3 px outline.
- **Hatch:** diagonal lines inside, `C.line` at 40%, every 14 px.
- **Stubs:** 40 px stubs of floor and ceiling line at the bottom and top on both sides (`C.line`).

In S91 two walls frame the narrow space where the inspector stands. That gap is the sixth room.

### `knock`
A knock, drawn as sound. `x`, `y`, `color` (`dim` / `red`), `size` (default 1), `at` (list of seconds).
- **Each knock:** three concentric arcs opening to both sides (radius 14 → 60 px at size 1), expanding over 10 frames and fading over 18.
- **Colours:** `dim` knocks use `C.dim`; `red` knocks use `C.red` with `url(#glowRed)`.

---

## Shot type: `vacuum-map`

The vacuum app's floor map, top-down, full frame. It is the episode's signature visual and should feel like a real robot-vacuum app drawn in the channel's style. Fields live under `shot.map`. `shot.accent: "red"` turns emphasis red.

**Map style:**
- **Background:** near-black (`C.bg`) with a faint dot grid (`C.line`, 12%).
- **Rooms:** filled rounded rects (`C.surface2`, radius 6) with small gaps between them (no drawn doors), `C.line` 2 px outlines, and mono labels (20 px, `C.dim`, letter-spaced) in each room's lower-left.
- **Cleaned area:** thin horizontal `C.blue` lines (1.5 px every 10 px, ~30%) clipped to the room.
- **Vacuum:** a small `C.fg` disc (r 14) with glow and a thin blue heading tick.
- **Dock:** a small outlined square with a blue dot.
- **Header:** top left, mono 22 px, `C.dim` (e.g. `LIVE MAP · 03:07`). When it mentions 6 rooms, the `6 ROOMS` part is red.

**Geometry** (map units; the house is 1000 × 600, scale ~1.25 to fit centred in 1920 × 1080; 100 units ≈ 1 m):

| Room | x | y | w | h |
|---|---|---|---|---|
| LIVING ROOM | 0 | 0 | 400 | 340 |
| KITCHEN | 0 | 340 | 400 | 260 |
| HALLWAY | 400 | 0 | 170 | 600 |
| BATHROOM | 570 | 0 | 430 | 210 |
| BEDROOM | 570 | 210 | 430 | 390 |
| **ROOM 6** (extra) | 1000 | 300 | 200 | 200 |

- **Inside the rooms:** the sofa is a rounded rect in the living room (60, 230, 240 × 80). The bed is a rect in the bedroom against its right wall (810, 380, 180 × 200), with a pillow line on the right end. That puts your head against the wall shared with room 6. The dock is a small square at (600, 560) in the bedroom.
- **Room 6** sits outside the house outline, attached to the bedroom's right wall. It is drawn `C.surface` with a **red dashed** 2 px outline, its label in red. It is never cleaned (no stripes), except in S80.
- **Trail** (the thing's path, grey dust dots `C.dim` every 26 units): (1000, 420) → (930, 470) beside the bed → (700, 420) → bedroom door (575, 340) → hall (485, 340) → (485, 480) → kitchen door (400, 485) → (240, 480).

Map fields:

| Field | Values |
|---|---|
| `rooms` | `draw-on`: rooms appear one by one (outline draws, then fill fades in, 0.3 s apart). `static`: all there. |
| `clean` | `none`, `all`, `sequence` (stripes sweep in room by room behind the vacuum dot, which travels a lawn-mower path through each room), `zigzag` (with `zoom: "living"`: one room, back-and-forth stripes drawn on progressively). |
| `vacuum` | Where the dot is: `hall`, `dock`, `along-trail` (follows the trail from its start, erasing dust dots as it reaches them), `into-extra` (after the clean sequence it drives through the bedroom's right wall into room 6 and fades out there). |
| `trail` | `visible`: dust dots shown. `erase`: shown, and erased by the dot moving `along-trail`. |
| `route` | `to-dock`: a dashed blue route draws from the dot's hall position (485, 400) through the bedroom door to the dock, and the dot follows it. The trail dots behind stay. |
| `extra` | `false`, `true` (room 6 shown), `appear` (it grows out of the bedroom wall: scaleX 0 → 1 from the wall edge over 0.6 s, then pulses its red outline twice), `faint` (shown at 30%). |
| `extraLabel` | `type`: the label `ROOM 6` types itself in, letter by letter. |
| `zoom` | `extra` or `living`: the map is scaled ~2.4× around that room. |
| `dims` | `true`: thin dimension lines with metre labels along the outer walls (e.g. `10.0 m`, `6.0 m`). `extra`: only room 6's two sides, `2.0 m` and `2.0 m`, drawing on. |
| `highlight` | `sofa` (sofa shape + living-room outline pulse blue), `bed` (a red ring draws around the bed), `rooms-sequence` (each room outline lights up `C.fg` in turn, spread over the line), `trail` (the dust dots pulse red once), `shared-wall` (the wall between bedroom and room 6 pulses red). |
| `header` | Header text. |
| `upload` | `true`: a thin progress bar under the map fills over the line, labelled `UPLOADING MAP`, mono. |
| `dim` | `true`: whole map at 70%. |
| `layout: "grid"` | Instead of one map: a 6 × 4 grid of small maps (same plan; vary each with mirroring and ±3° rotation using `rand`), appearing one by one over the first 60% of the line. Each has its small red room 6 pulsing. Over the grid, a centred `count` (`CounterNumber` from `figures/Marks`, 200 px) counts up to `count` with `countLabel` under it, on a dark rounded plate so it stays readable. |

---

## Sound

No new sound effects. The knocks are silent on purpose (the drone bed ducks on `silence`), and the kit's `click`, `static`, `page`, `stamp` and `tick` cover the rest. If a knock sound feels necessary after review, it is a kit change: add it to `brand/audio.json` and `brand/sfx/`, log it in `brand/CHANGELOG.md`, and keep it very soft.

## After this episode

`robot-vacuum`, `phone` and `wall` are likely to come back (smart-home and house-plan advisories). If Advisory 0003+ needs one of them, promote it into the kit (`BRAND.md` §6) and add it to the props reference sheet.
