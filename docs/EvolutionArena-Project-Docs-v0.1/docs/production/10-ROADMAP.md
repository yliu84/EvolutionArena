# Development Roadmap

This roadmap uses **gates**, not promises. Do not fund the next phase merely because the previous phase is “finished”; advance because evidence says the game is fun enough.

## Phase 0 — Foundation Audit

Goal: understand current prototype and make core rules maintainable.

Deliverables:
- runnable browser build;
- documented current architecture;
- deterministic/random service plan;
- data-driven creature/mutation definitions;
- basic automated tests;
- telemetry hooks for playtest metrics (remaining).

Exit:
- build/test stable;
- no architecture rewrite unless justified by current code.

## Phase 1 — Core Playable Loop

Goal: one complete run is playable with placeholder art.

Scope:
- movement;
- primary attack + one ability/dash;
- health/death;
- biomass;
- genes;
- six evolution stages;
- automatic hunt-driven evolution with preview and one Resist;
- one map;
- randomized safe spawn (remaining);
- 24 species presentations across 6 shared behavior archetypes;
- elites;
- one boss;
- 12–18 minute validation pacing with optional overgrowth and no hard timer;
- results/restart.

Exit:
- a new tester can finish/lose a run without developer help;
- first mutation happens quickly;
- restart is frictionless.

## Phase 2 — Replayability Pass

Goal: make repeated runs meaningfully different.

Scope:
- spawn-zone ecology;
- stronger gene/prey relationship;
- mutation synergies/trade-offs;
- optional rare boss (post-core validation);
- secrets/rare gene cache;
- creature/gene encyclopedia;
- seeded runs.

Exit evidence:
- median ≥3 runs in an observed test session;
- ≥50% of deaths followed by immediate replay;
- testers describe different build paths without prompting.

## Phase 3 — Visual Vertical Slice

Goal: prove the game can look distinctive and shareable in browser.

Scope:
- coherent 2.5D art direction;
- production-quality player creature;
- modular visible mutations;
- representative biome polish;
- VFX/audio feedback;
- boss polish;
- performance optimization.

Exit:
- players notice and understand visible evolution;
- stable target performance;
- clips/screenshots are worth sharing.

## Phase 4 — Public Web Demo

Goal: test with a larger audience.

Scope:
- onboarding;
- settings/accessibility basics;
- analytics with consent/privacy review;
- bug reporting;
- hosting/deployment;
- content polish.

Key metrics:
- first-minute comprehension;
- run completion/death funnel;
- replay rate;
- median runs/session;
- return rate where measurable;
- mutation selection distribution;
- boss reach/kill rates.

## Phase 5 — Commercial Decision

Choose based on evidence:
A. Expand single-player browser/PC game
B. Build Steam demo/full version
C. Prototype multiplayer arena
D. Stop/pivot

## Phase 6 — Multiplayer Prototype (Conditional)

Only after core-loop validation.

Test:
- 6–12 players;
- anti-snowball mechanics;
- player gene rewards;
- Apex bounty;
- server authority;
- matchmaking/fill strategy.

Do not assume this phase will happen.
