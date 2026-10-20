# Brief: Advisory 0002

## The video

**Title:** If Your Robot Vacuum Ever Starts Cleaning At 3 AM… DO NOT TURN ON THE LIGHT
**Format:** "rules horror" instruction tape, 16:9, about 5 minutes, English.
**One-line pitch:** At three in the morning your robot vacuum starts cleaning on its own. The Department explains six directives. In the end you learn that your home has one room more than you think, right behind your bedroom wall, and that the vacuum has been erasing the way to your bed every night for four years.

Channel identity, layout and characters are fixed: see `brand/BRAND.md`. The voice is locked: MiniMax Speech 2.8 HD, voice `English_ManWithDeepVoice`, through OpenRouter as `minimax/speech-2.8-hd`. It ignores tone instructions, so the delivery is written into the text (short sentences, "..." for held pauses).

## Story logic

1. **The hook.** Robot vacuums sit on their dock at night. Yours only leaves it when the floor has changed. At 3 AM the floor has changed: something has walked through your home and left a faint trail of dust. The vacuum is cleaning up behind it.
2. **Directive 1: Do not turn on the light.** The vacuum finds its way in the dark with a laser. Light blinds it, so it stops, and the trail stays. Case 0314 (Leeds): in the morning there was a line of dust across her bedroom floor, from the wall to the side of her bed.
3. **Directive 2: Do not open the app** (the one most households violate). The live map shows your five rooms, and a sixth. The app has already named it ("ROOM 6"). *"We will not be putting the name in writing."*
4. **Directive 3: Do not follow it.** It cleans in a straight line, and vacuums don't do that. It is following something, and every few metres it stops to let it get ahead. Follow it and you're behind the vacuum, and the vacuum is behind something else.
5. **Directive 4: Do not send it home.** "Return to dock" makes it stop and drive back to its dock in your bedroom. The rest of the trail stays. Tomorrow night, they won't have to look for the way.
6. **Directive 5: If it knocks, do not answer.** The vacuum bumps your bedroom door three times, low. Then a fourth knock, higher up. **Slip:** *"We usually stop at four."* → *"Apologies. That remark has been redacted."* (slip line L068)
7. **Directive 6: Never replace it.** The emotional turn. It's slow now, misses corners, gets stuck under the sofa and beeps. You've had it four years: 1,461 nights. You thought it cleaned while you were out; it cleaned while you were asleep, erasing the way to your bed. A new one won't know your home, and on its first night it will clean every room, including the sixth. Keep the old one. Let it be slow.
8. **Addendum.** Every map your vacuum makes is uploaded, and a copy comes to the Department. *"The Department of Unlisted Risks has collected floor plans for twelve years."* In 3,040 homes the map has one room more than the house. It's always 2 m by 2 m and always next to the bedroom. It's where our inspectors wait between inspections. They come out at three and leave very little behind, only dust. Your vacuum has erased every one of their trails. That is why it is listed as a risk.
9. **Callback.** If you hear your vacuum at 3 AM tonight, it is not cleaning. Keep the light off. Stay in bed. And let it work.

**Continuity with Advisory 0001:** the same Department, the same faceless grey **inspector**, the same reveal shape (a household thing has been quietly protecting you, and that is why the Department lists it as a risk). In 0001 the inspectors stood in corners; here we learn where they wait.

## Directives

| # | Title | Escalation |
|---|---|---|
| 1 | Do not turn on the light | The trail stays where you can see it (case 0314) |
| 2 | Do not open the app | The map has a sixth room, already named |
| 3 | Do not follow it | It is following something, and waits for it |
| 4 | Do not send it home | The trail becomes a road for tomorrow night |
| 5 | If it knocks, do not answer | A fourth knock, higher up; the slip |
| 6 | Never replace it | Four years of erasing the way to your bed |

## Assets

- **Kit characters used:** person ("you"), inspector (hinted at 10–25% opacity until the addendum reveal), crowd (none), cat (none).
- **Kit props used:** bed, door, window, clock, floor lamp, sofa, box, doc, case-file, counter (`decor: dots-grid`), calendar (`fromYear`/`toYear`/`pageLabel`), seal, cards.
- **New episode assets** (spec in `assets-spec.md`; declared in `scenes.json → meta`):
  - elements: `robot-vacuum`, `dock`, `phone`, `wall`, `knock`
  - shot type: `vacuum-map` (the app's floor map, full frame, plus a grid layout for the addendum)

## End card

Status word: **MAPPED.** + "NEXT ADVISORY: 0003".
