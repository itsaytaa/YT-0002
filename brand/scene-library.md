# Scene library

Everything on screen is drawn in code (React + SVG inside Remotion). There are no image or video generation steps. This file specifies every component that `scenes.json` refers to. Colours and fonts come from `style.json`.

Since Advisory 0001 these components exist in the shared kit (`video/src/figures`, `video/src/shots`). What they look like is fixed by the golden images in `brand/reference/` (characters, props, layout, cards). This file is the description; the PNGs are the authority. For assets the kit doesn't have, see `brand/BRAND.md` §5–6.

## Conventions

- Coordinates in `scenes.json` are pixels in a 1920×1080 frame. They are **composition guides**: keep the described layout and the relationships between elements (who looks at what, what stands between what), but adjust positions and sizes freely if something overlaps, crowds the captions, or leaves the safe area.
- Figures (`person`, `cat`, `inspector`, furniture) use `x` = horizontal centre and `y` = the ground point (bottom of the feet or legs). `h` = total height.
- `facing`: `left`, `right`, `front`, `back`, `away` (= seen from behind), `down-right` (head tilted to look down to the right).
- Anchors referenced by `gaze`, `label` and `speech`: `cat.eyes`, `cat.ears`, `cat.tail`, `cat.paws`, `cat.haunch`, `person.head`, `corner.vertex` (the top point where the two walls meet the vertical line, use 40% of the corner's height for gaze targets). Every figure component must expose these anchor points.
- `opacity`, `outline: "red"` (a 3 px red outline around the silhouette), `color: "dim" | "grey"` and `delay` (seconds after line start) can be set on any element.
- `same_as`: start from that shot's full spec and apply the fields listed in this shot. `add`: extra elements on top of the referenced shot.
- `desc` is the authority when structured fields and description disagree.

## Shot types

| type | What it is |
|---|---|
| `tableau` | Pictogram scene from `elements`, optional `camera`, `accent`, `style: "slip"`, `dim` (0–1 global darkening). |
| `directive-card` | Directive card (see style.json → cards.directive). Fields: `n`, `title`. |
| `addendum-card` | Addendum card (style.json → cards.addendum). |
| `doc` | One paper document (style.json → documents). Fields under `doc`: `header[]`, `lines[]` (█ = redaction bar), `highlight[]` (line indices), `highlight_color`, `stamp {text,line,color,anim}`, `anim` (`slide-up`, `typewriter-then-redact`, `type-line`, `redact-line`), `type_line`, `redact_line`, `focus_line`. |
| `case-file` | Manila folder with paper clip, typed label `CASE <number>` and `<location>`, red `UNLISTED` stamp. Slides in from the right. |
| `floorplan` | Top-down plan of a small flat in thin fg lines: living room, kitchen, bedroom, bath, hall. Markers: cat (small filled circle with two ear triangles), person (rounded square), corner (blue triangle in a room corner), bookcase (rectangle). Lamps: small circles that fill with a soft white glow when on. Animations: `lamps-on-sequence` (0.25 s apart), `lamps-off-sequence` (reverse), `marker-move` (path through doors, 1.2 s, ease-in-out). `plan.caption`: the small mono line top right (default `PLAN · RESIDENCE`). |
| `counter` | Big number in display font 240 px, counting from `from` to `value` over 70% of the line (ease-out), thousands separator, mono `label` under it in dim. Optional `accent: "red"`, `x` (move the number off-centre) and `decor`: `folder-stack` (case folders pile up beside it; `decorCount`), `redacted-list` (redacted rows scroll behind it, a red pin drops on it), `dots-grid` (one dot per unit fills in). |
| `calendar` | A tear-off calendar block flipping pages quickly from `fromYear` to `toYear` (default: the last `value` years up to 2026), red page header `pageLabel` (default `DAY`), counter `value` + `label` beside it. |
| `seal` | Department emblem: two concentric circles, ring text DEPARTMENT OF UNLISTED RISKS (mono, letter-spaced) set on a circular path, in the middle a house outline with a single open eye inside it, under the emblem `EST. 1914`. Ring text rotates in by 20° while fading in. Colour fg with blue eye. |
| `end-card` | style.json → cards.endCard. |

## Elements

Any element accepts `z` (number) to set its draw layer explicitly; higher draws on top. Useful for episode-specific elements, which otherwise draw at layer 0.

### person
Signature: rounded-square head, faceless. Poses:
- `stand`: upright, arms down. Supports `head-turn` {from,to} (head rotates/turns via a slight x-offset and a narrower head when in profile).
- `sit-sofa`, `sit-chair`: seated, knees forward. `read`: seated holding a book in both hands in front of the chest.
- `kneel`: one knee down. `push`: leaning forward 20°, both arms extended to the right. `shrug`: arms bent, palms up, shoulders raised.
- `sit-floor`: cross-legged. Supports `facing: "back"` and `head: "down"`. Animation `sit-down`: lower from stand over 20 frames.
- `lie-bed`: horizontal on a bed, only the head and blanket shape visible.

### cat
Simple shapes, recognisably a cat at small sizes. Poses:
- `sit-back`: seen from behind; ears up, tail curled around one side. Anim `tail-still` = no tail motion at all.
- `sit-side`, `stare`: side profile, upright, ears forward, front paws together, tail flat on the floor. `stare` = same pose, perfectly still, ears pointing forward.
- `sit-front`: facing the viewer. Supports `eyes: "heavy"` and anim `head-dip` (head lowers slowly, jerks back up once).
- `face-close`: large head only, front view, almond eyes in bg colour with vertical pupils. Anims: `no-blink`, `pupils-dilate` (pupils widen slowly), `head-turn` from `right` (profile) to `front`.
- `head-turn`: side pose where only the head turns toward the viewer and back. `ears: "back"` flattens the ears.
- `loaf`: lying with paws tucked in, seen from behind/side.
- `walk`: two-frame step shuffle; supports `walk {fromX,toX,stop_at}` (stop at that fraction of the line, then freeze mid-step).
- `sleep`: curled-up oval with tail around it. Anim `breathe` = scale-y 1 → 1.03 every 2.5 s.
- `age: "old"`: 8% smaller, slightly lower ears, a little slower. `eyes: "squint" | "closing"`, anim `slow-blink`.

### inspector
The Department's inspector: rounded-square head with a wide-brim hat, long coat, clipboard. Grey, faceless, never moves unless animated. Poses: `stand` (full figure), `corner` (full figure standing in a room corner, very slightly turned toward the room), `lean-over` (bending over a sofa back, head tilted down toward the book), `bust` (head, hat and coat collar only). Anim `carbon-jitter`: blue offset ghost (+4 px/-2 px) flickering every 3–5 frames. `visible_frames` = [startFraction, endFraction] of the line during which the element is visible.

### corner
See style.json → figures.corner. Variants `plain`, `lit`, `washed`, `dark`. `emphasis: true` = thicker 5 px strokes with glow. Anim `brighten`.

### Furniture and props
| el | Drawing |
|---|---|
| `bookcase` | Tall rectangle outline with 4 shelves and a few book spines. Supports `slide {dx, from_dx}`. |
| `sofa` | Low rounded shape with 2 seat cushions and armrests. `close: true` = large partial view; `dent: "left-seat"` = a soft dip in that cushion; `view: "back"` = seen from behind as a foreground silhouette. |
| `armchair` | Single-seat version of the sofa. |
| `bed` | Frame with headboard, mattress and blanket. |
| `floor-lamp` | Pole with shade. `state: "on"` adds a white light cone; anim `switch-on` (2-frame flicker then on, click sfx). |
| `window` | Four-pane window. `sky`: `moon` (crescent, blue), `sun`, `day`, `moon-to-sun` (crossfade over the line). |
| `clock` | Round wall clock. `time` "HH:MM" positions the hands. Anims `tick` (second hand), `spin-fast` (hands sweep several hours). |
| `cat-bed` | Plush oval bed with a hanging price tag showing `tag`. Anim `tag-sway`. |
| `box` | Open cardboard box (outline with flaps); `inside: "box"` on the cat clips its lower half. |
| `book` | Open book in two hands (close-up). Anim `page-turn`. |
| `bird` | Small bird silhouette. Anim `land` (drops 30 px onto the sill with a small bounce). |
| `door` | Front door outline with handle; `mat` = doormat rectangle in front of it. |
| `room-iso` | High-angle (≈35° from above) simple room: floor rectangle in perspective, the listed `contents` as small pictograms; the cat looks up toward the camera. |
| `doc-mini` | Small version of the advisory memo (paper), no readable text. |

### Marks and annotations
| el | Drawing |
|---|---|
| `gaze` | Dotted line (6 px dots, 14 px gaps) from `from` to `to`. Anim `draw-on`. `blocked_by: "person"` = stop the line at that figure. |
| `mark` | `cross` (two thick strokes), `check`, `circle` (ring). Colours blue or red. |
| `eye` | Large almond eye pictogram, fg outline with filled iris. |
| `label` | Thin leader line from the target anchor to a short mono label (24 px, letter-spaced; 16 px was too small at 1080p). |
| `speech` / `thought` | Rounded bubble with tail toward `from`. `size: "small"`, `outline_only: true`, anim `fade-out`. Text in caption font. |
| `boundary` | Dashed blue line on the floor between two points. |
| `glow` | Soft radial gradient light in the given colour and opacity. |
| `crowd` | `n` identical persons in a row, all facing the same way. |
| `checklist` | Clipboard-style paper card with checkbox rows. `tick` = index of the row that gets ticked (anim `tick`, blue check drawn in 10 frames). |
| `counter` (as element) | Same as the counter shot type but smaller (number 140 px), anchored at x/y. |

## Building order

1. Tokens (`style.json` → `src/theme.ts`) and font loading.
2. Primitives: `Person`, `Cat`, `Inspector`, `Corner`, then props and marks.
3. Shot renderers per `type`, plus a generic `Tableau` that maps `elements` to components.
4. Overlays: `Hud`, `Caption`, `Grain`, `Vignette`, transitions.
5. `Video` composition that walks `lines` + `timings.json`, resolving `same_as`, `add` and `hold`.

Render one still per shot early (see CLAUDE.md, step 7) and fix the primitives before working on animation polish.
