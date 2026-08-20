# Goal 6A — River Valley First-Minutes Acceptance

## Player entry

- Bare live URL opens **Gloamwood Valley**, not the retired compact nest sample.
- `?map=gloamwood` remains available only as a focused legacy combat check.
- First view: road, river, player and nearby life are visible; the two-step guide explains only move, lock and the held basic attack.
- Nearby aggressive creatures stay calm for up to 18 seconds or until the player travels 14 metres. Striking always wakes the struck target immediately.

## Physical readability

- Visible floor trees and loose boulders block the player through the same data that renders them.
- Ground foliage stays passable; cliffs remain constrained by terrain rather than adding a second invisible wall.
- Every starting living creature has body clearance plus `pairGap` combat space from every other living creature.

## Review links

Use a current Vite port and set a reproducible seed:

```text
/?debug=1&evolutionSeed=goal6a&mapSeed=goal6a
/?debug=1&bossGate=1&bossIndex=0&evolutionSeed=goal6a-boss
```

`bossIndex` may be `0`, `1`, or `2`. It must show the river-valley Boss at a playable surface range, lock it, and retain the evolved player body.

## Phone landscape

At 844×390, the HUD must show health, current status, lives, Biomass, More info, full screen and settings without clipping. Gene/milestone totals appear only after More info. Touch move, lock and attack remain outside the central fight view.

## Automated and local evidence

- Full regression: 102 test files / 941 tests passed.
- Production build passed after the implementation. Existing Vite warning: a legacy chunk remains above 500 kB after minification; no new build error.
- Browser desktop pass: bare local route displayed the river valley, compact guide, 369 rendered-scatter collision obstacles, 100 health after an idle reading window, and no console error.
- Browser 844×390 pass: Genes were visually hidden in compact HUD and available after expansion; touch controls stayed in their two lower corners.

Physical-device testing remains a user acceptance step; browser emulation does not replace a real phone’s gesture, thermal and browser-chrome behavior.
