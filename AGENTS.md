# Evolution Arena Lite Agent Instructions

These instructions apply to the entire repository.

## Start here

Before changing the game:

1. Read `PROJECT_CONTEXT.md` completely.
2. Inspect `git status`, the current branch, recent commits, relevant source and tests.
3. Read the canonical documents named in `PROJECT_CONTEXT.md` for the system being changed.
4. Preserve unrelated work. Do not replace an accepted system merely to impose a different architecture.
5. State the player-visible outcome and pass condition before implementing a meaningful gameplay or visual change.

## Product direction

- This is a browser-first, single-player 2.5D/3D hunt-and-evolve action game.
- The core fantasy is starting as a small creature, hunting and evolving through visibly different forms into a powerful apex creature.
- Exploration, prey choice, evolution variety and satisfying combat are the main reasons to replay.
- Real-time multiplayer, accounts, server economies and large commercial infrastructure are deferred unless explicitly approved.
- Do not copy copyrighted Warcraft, Diablo or Honor of Kings assets. They are quality and readability references only.

## Accepted mother-monster baseline

- The accepted first-version mother-monster is the coral-crested gecko.
- Runtime IDs: `coral-gecko-master-v1` and `coral-gecko-combat-master-v1`.
- Its full contract includes the web GLB budget, intentional map scale, four-foot grounding, terrain-safe collision, contact shadow, locomotion, turning, tail inertia, target-facing basic attacks, hit feedback, death/reset behavior and browser diagnostics.
- `Bite → Claw → TailSwipe` is one looping **basic-attack chain** on one primary-attack input. These are not separate skills.
- Every basic-attack step must face the player's current locked target. Do not introduce random auto-attacks.
- The skill-attack system is a separate future milestone. Do not add mana, skill slots, independent skill cooldowns or skill upgrades while working on basic attacks unless the user explicitly starts that milestone.
- Later monsters may use different skeletons and attacks, but must meet or deliberately replace the quality gates in the character baseline document.

## Engineering and asset rules

- Keep authoritative health, damage, range, targeting and collision separate from animation and visual feedback.
- Camera shake, flash, particles and visual knockback must never decide damage or change logical attack range.
- Prefer named, typed tuning data over unexplained constants in frame loops.
- Pool frequently emitted particles and effects.
- Preserve seeded/deterministic game logic where applicable.
- Keep AI-assisted asset provenance, processing notes and license status documented.
- Do not replace the accepted 32,000-triangle runtime model with a high-detail source sculpt.
- Regenerated GLBs must pass `npm run validate:gltf -- <path>` with zero errors and zero warnings.

## Required verification

For meaningful game changes, run:

```bash
npm run build
npm test
```

For GLB changes, also run the GLB validator. For player-visible changes, verify the complete loop in a real browser, check console/page errors, and inspect desktop 1440×900 plus mobile landscape 844×390. Record bundle-size warnings and real-device performance gaps rather than hiding them.

## Documentation and Git

- Update `PROJECT_CONTEXT.md` when a milestone, accepted baseline, architecture boundary, test count, entry point or next-stage decision changes.
- Update `docs/DEVELOPMENT-LOG.md` for meaningful implementation and validation work.
- Update the relevant design/asset source of truth rather than relying on chat history.
- Do not commit secrets, downloaded private files or unrelated local changes.
- Do not push, deploy or publish unless the user requests it.

## Completion standard

Do not call work complete because it compiles. Confirm the requested behavior is implemented, production build and relevant tests pass, visible behavior is browser-tested, no new P0/P1 defects exist, and remaining limitations are stated clearly.
