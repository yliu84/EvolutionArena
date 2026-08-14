---
name: evolution-arena-juice
description: >-
  Combat juice, hit feedback, skill telegraphs, and 2.5D presentation for Evolution Arena Lite.
  Use when changing melee/ranged/magic attacks, hitstop, sparks, screen shake, slash trails,
  projectile tracers, magic bursts, monster hit flashes, or when the user mentions 打击效果,
  技能效果, juice, VFX, 比魔兽更好, or combat feel.
---

# Evolution Arena juice

Make each attack feel heavier and clearer than a Warcraft 3 unit swing. Do not try to beat Warcraft as a whole art package, and do not copy its skill bar or Diablo loot UI.

## Non-negotiables

- Presentation only. Tweens, sparks, shake, and hitstop must not change damage, range, cooldowns, or who got hit.
- Three styles must stay distinguishable by **shape**, not color alone: melee wedge, ranged spike/tracer, magic ring.
- Hitstop uses real time (`performance.now()`), never `this.time.now + ms` while `timeScale` is reduced.
- Numbers live in `src/combat-juice.ts` (`COMBAT_JUICE`). Do not invent new literals in `main.ts` update loops.
- Geometry-first 2.5D: isometric sprites and y-sort occlusion. No imported Warcraft/Diablo assets, no 3D camera, no Blender/Spine pipeline, no unique painting per gene combo.

## When implementing a swing

1. Telegraph before damage (already required by combat styles).
2. On impact: style burst + hitstop if it connected + short camera shake + sparks on the hurt body.
3. Animate the burst across `juiceBurstMs(style)` frames; do not flash one circle and delete it.
4. Ranged: rotate the bolt, draw a tracer while it lives, spark at the body on overlap.
5. Expose juice state on `window.__EA_DEBUG__.getState().combat` in development builds.

## Pass bar

A player (or screenshot) must be able to tell, without HUD text:

- which of the three styles just fired
- whether the swing connected
- which body took the hit

If those three fail, the juice change is not done.

## Do not

- Add a skill bar, equipment flashes, or loot beams
- Freeze the sim at `timeScale = 0`
- Stack unlimited sparks (cap in `COMBAT_JUICE`)
- Raise shake so the camera hides telegraphs
- Expand the world or retune 24 monster stat tables to “feel stronger”

## Additional resources

- Numeric bar and colors: [reference.md](reference.md)
- Code: `src/combat-juice.ts`, `src/combat-fx.ts`, `src/combat.ts`
- Product constraints: `docs/DEVELOPMENT-LOG.md` current decisions
