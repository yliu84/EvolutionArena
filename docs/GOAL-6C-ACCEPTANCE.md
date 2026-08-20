# Goal 6C — Elite and Boss Threat Readability

## Intent

Make an Elite or Boss read as a different encounter before the player has to
infer it from a health total. This is a presentation pass over existing
authoritative tier, affix, health and phase state. It does not change models,
map environment, collision, damage, ranges, AI decisions or controls.

## What must be true

- Ordinary prey retains the quiet locked-target name and health bar.
- Every Elite has a slowly breathing, hexagonal world seal and a lock plate
  containing a distinct shape mark, `ELITE` label and its named affix. Affix
  identity must be readable from icon/text as well as colour.
- A locked River Valley Boss has one top-centre encounter plate with its name,
  phase and health. Its in-world ground seal remains, but it has no duplicate
  world nameplate or health bar over the body. Phase two changes the encounter
  plate's border and health treatment without hiding the phase text.
- Mobile landscape keeps the Boss plate above the play field without covering
  the left combat HUD, right HUD actions or touch controls. It must not create
  horizontal page overflow.
- All presentation is a consumer of existing `tier`, `elite.affix`,
  `bossPhase`, health and max-health state. It is never a combat or progression
  decision source.

## Reviewer entry

Use the live River Valley, not an old MapLab URL:

```text
/?debug=1&evolutionSeed=goal6c&mapSeed=goal6c&bossGate=1&bossIndex=0
```

Confirm that Tide Cleaver immediately reads as a Boss. For an Elite, approach
and lock a branch encounter: its six-sided ground seal and `ELITE · [affix]`
nameplate should be visible without adding a new button or HUD panel.

## Automated and browser evidence

- Full Vitest regression: **103 files / 949 tests** passed.
- Production build passed; the pre-existing legacy bundle remains over 500 kB
  after minification and is recorded separately as a release optimisation.
- A local River Valley Boss was checked at 1440×900 and simulated 844×390
  landscape: the dedicated Boss name/phase/health plate was visible with no
  duplicate world nameplate, no horizontal overflow and no console errors or
  warnings.

## Acceptance record

- **Accepted by the project owner on 2026-08-20.** The final review explicitly
  rejected duplicated Boss information over the model; Bosses now retain only
  the fixed top encounter plate plus their spatial ground seal.
