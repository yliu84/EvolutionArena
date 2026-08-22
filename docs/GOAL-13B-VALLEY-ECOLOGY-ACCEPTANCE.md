# Goal 13B — River Valley Ecology Rotation

## Player promise

Each new River Valley run deals one small encounter deck. It changes which of
the existing Fang, Shell and Swarm creatures travel together, and re-deals the
existing Elite affixes. The full valley still contains all three prey families:
this is not a biome split that removes creature variety from a run.

The local radar's small caption reads `region · ecology`, so the condition is
visible without adding a second HUD panel. A run can be reviewed exactly with
`?ecologySeed=<value>`; map layout, weather and evolution seeds remain separate.

## Scope boundary

- No new models, map geometry, vegetation, audio, controls, skills or attack
  buttons.
- No changes to creature health, damage, attack timings, collision, Boss rules,
  evolution odds or region gates.
- Pack, nest, Elite and Boss counts remain unchanged. Only mixed pack membership
  and the already-existing Elite affix deal rotate.
- The rotation is calculated once at run creation. It adds no recurring update
  work and no new entities.

## Acceptance checks

1. Reloading without `ecologySeed` can select a different named deck; the same
   explicit seed reproduces one deck.
2. Every deck contains Fang, Shell and Swarm somewhere in the same run, and
   every road pack remains mixed.
3. Geography, gate spacing, encounter counts and existing Boss progression are
   unchanged.
4. Desktop 1440×900 and mobile landscape 844×390 show the compact label with
   no HUD collision or overflow.
5. Production build, focused ecology/spawn tests and the complete Vitest suite
   pass with no new browser console/page errors.

## Validation record — 2026-08-22

- Focused ecology/spawn tests: 2 files / 24 checks passed; the broader
  valley-focused set: 5 files / 61 checks passed.
- Full suite: 110 files / 1002 checks passed. Production build passed; the
  existing legacy bundle warning above 500 kB remains recorded and unchanged.
- Browser: `ecologySeed=oak` produced **Fang migration**, and reloading the
  same URL reproduced the same pack signature. `ecologySeed=river` produced
  **Swarm bloom** with a different signature. Both retained Fang, Shell and
  Swarm creatures.
- Responsive: desktop 1440×900 and mobile landscape 844×390 showed the compact
  radar caption, with no horizontal overflow and no collision with Lock or
  Attack. Browser console/page errors: zero.

## Owner acceptance

Accepted on 2026-08-22. The owner noted that the resulting hunt feels slightly
easier. This is recorded as a follow-up balance observation, not silently
answered by changing creature health or damage in an ecology/UI milestone.
