# Goal 12 — Per-run Weather Acceptance

## Player promise

Each new River Valley run receives one presentation-only weather seed. It
chooses **dawn**, **mist**, or **rain** at the start and keeps that weather for
the entire run. A restart begins another run and therefore receives a new
weather seed. Weather never changes mid-combat.

The gameplay map seed and the evolution seed are untouched. This keeps their
existing deterministic tests and replay links intact while adding a small,
visible source of run-to-run variety.

## Review links

```text
?weather=rain                 # force rain, regardless of the weather seed
?weather=mist                 # force mist
?weather=dawn                 # force dawn
?weatherSeed=review-run-7     # reproduce one normal seed-selected mood
```

## Explicit non-goals

- No weather damage, AI rules, visibility penalties, or combat modifiers.
- No changing weather during a run, rain physics, full day/night clock, or
  additional particles beyond the existing camera-local rain batch.
- No change to map placement, evolution choices, enemy rolls, or controls.

## Verification

```bash
npx vitest run tests/gloamwood-valley-weather.test.ts tests/gloamwood-hunt-rhythm.test.ts
npm test
npm run build
```

Pass condition: two normal new runs expose different `weatherSeed` values in
development debug state; forced weather links still take precedence; desktop
and 844×390 mobile landscape retain legible combat UI without errors.
