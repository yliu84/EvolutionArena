# Goal 6B — River Valley Complete-Run Acceptance

## Intent

Validate one complete River Valley hunt before expanding models, skills or map
art. A natural run targets **about 20 minutes**; 18–22 minutes is the current
acceptance window. This is a pacing contract, not permission to make travel or
combat repetitive.

The run has five deliberate mutation boundaries. Each sits after a meaningful
event rather than interrupting a fight:

1. clear the Shallows nest;
2. defeat the Tide Cleaver;
3. enter the Gorge;
4. defeat the Gorge boss;
5. enter the Headwater.

The Source Root is the final build test: defeating it ends the run instead of
opening a sixth menu.

## What must be true in a natural run

- The first and second regional gates remain shut until their preceding Boss
  dies. Normal movement, knockback and an obstacle correction cannot push the
  player through a shut gate.
- Defeating the Shallows/Gorge Boss records its matching milestone immediately;
  it cannot be skipped by moving away before the next frame.
- Defeating the Headwater Boss opens the victory result. The final result names
  the prey genes collected and the mutations chosen, and explains that Genes
  weight future candidates rather than guaranteeing a result.
- Completion is keyed to the authoritative `dead` state of a Headwater Boss,
  not to model/body lookup success. Victory clears keyboard and touch movement
  intent, freezes simulation and focuses the result dialog.
- Biomass still drives the two visible body evolutions. Skills remain disabled.
- Debug jump links (`evolutionGate=1` or `bossGate=1`) are labelled as debug
  pace evidence and never count toward the natural-run time window.

## Player validation

Use one reproducible no-skip route:

```text
/?debug=1&evolutionSeed=goal6b&mapSeed=goal6b
```

For a clean pacing measurement, do not append `evolutionGate`, `bossGate` or
`pace`. Start a fresh page load and finish the Source Root naturally. The player
should be able to answer, without documentation:

1. What must I defeat to continue upstream?
2. Why did these evolution/mutation candidates become more likely?
3. What did I change in this run?

`&pace=1` is available only to inspect the developer timing label after a
result. It is not player-facing tutorial copy.

## Automated/browser evidence

- Progression tests cover ordered boundaries, one-time rewards, the two Boss
  gates, position clamping at shut chokes and the final hard stretch.
- Full regression: **102 test files / 945 tests** passed.
- Production build passed. Vite retains the pre-existing legacy bundle-size
  warning (>500 kB); it is not a Goal 6B regression.
- Desktop 1440×900 browser check: River Valley loaded with the origin model,
  `Mutations 0/5`, no horizontal HUD overflow and no console errors/warnings.
- Simulated phone landscape 844×390: `Mutations 0/5`, no horizontal overflow,
  lock control 52×52 px, held attack control 82×82 px, no console errors/warnings.

## Acceptance record

- **Accepted by the project owner on 2026-08-20.** The complete River Valley
  route, terminal Source Root result and the run's evolution explanation were
  tested after the Headwater victory-authority repair.
- The remaining real-device performance capture and outside no-explanation
  sessions are not claimed as completed evidence. They move forward as measured
  commercial-playtest work in Goal 7 rather than keeping this already accepted
  complete-run implementation artificially open.
