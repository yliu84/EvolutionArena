# Evolution Arena Lite — Project Context

Last updated: 2026-08-15  
Repository: `https://github.com/yliu84/EvolutionArena.git`  
Project path: `/Users/yangliu/Documents/EvolutionArenaLite`  
Branch: `main`  
Last accepted product milestone commit: `21e6031` (`feat: complete first mother monster master`)

## Purpose of this file

This is the short, current handoff for a new Codex task. Chat history is not the source of truth. Start with this file, then read only the canonical documents relevant to the requested system.

## Product vision

Evolution Arena Lite is a browser-first single-player hunt-and-evolve action game. The player explores a large fog-covered map, hunts varied creatures, gains evolution resources and develops through visibly different creature forms. The replay hook is discovering different hunt routes and evolution outcomes.

The intended presentation is a readable elevated 2.5D/3D view with Warcraft-like unit readability and MOBA-like map scale and polish, without copying proprietary assets. The first release remains a validation build rather than a mature commercial live-service game.

## Current technical stack

- TypeScript and Vite
- Phaser 3 for the established browser game
- Three.js for the current Quality 3D character/map vertical slice
- Vitest for automated tests
- Blender scripts for reproducible GLB rigging and animation export
- Local development server currently uses port `5174`

Common commands:

```bash
npm run dev
npm run build
npm test
npm run validate:gltf -- public/assets/quality-3d/models/coral-gecko-rigged-v3.glb
```

## Current accepted milestone

The coral-crested gecko is the first completed mother-monster production reference.

Runtime identifiers:

- character/material/locomotion baseline: `coral-gecko-master-v1`
- combat baseline: `coral-gecko-combat-master-v1`
- runtime model: `public/assets/quality-3d/models/coral-gecko-rigged-v3.glb`

Accepted model contract:

- 32,000-triangle browser LOD with documented source and processing history;
- 21-bone quadruped rig with weighted jaw, four tracked feet and four tail joints;
- named `Idle`, `Run`, `Turn`, `Bite`, `Claw`, `TailSwipe`, `Hit` and `Death` clips;
- four-foot grounding, terrain height correction, terrain-safe body footprint and three-part contact shadow;
- movement-matched running, real turning, tail inertia, dust and material/weight response;
- a single Space-key basic-attack chain: `Bite → Claw → TailSwipe`;
- one buffered next attack and a 1.15-second idle combo reset;
- each attack step reacquires the live locked target, turns at 12 radians/second and refuses contact above 8 degrees of aim error;
- authoritative attack timing/range/damage separated from animation;
- pooled impact fragments, brief flash, restrained camera trauma and visual-only knockback;
- non-attacking armored training creature with health, death and 1.8-second respawn for demo validation;
- debug evidence for action, targeting, health, range, hit/death counts, grounding, asset state and FPS.

The three attack animations are ordinary attacks, not skills. The skill-attack system has not started and remains explicitly disabled.

## Latest validation evidence

- Production build passed.
- Vitest: 47 test files and 243 tests passed.
- Final runtime GLB: zero glTF errors and zero warnings.
- Desktop 1440×900 and simulated mobile landscape 844×390 passed at approximately 120 FPS on the development machine.
- Browser console/page errors: zero in the latest accepted pass.
- Reverse-facing attack test started around 74 degrees away from the target, reached zero aim error before contact and applied damage correctly.
- Known release gap: a real midrange mobile device must still demonstrate stable 30 FPS.
- Known bundle follow-up: Vite still reports chunks larger than 500 kB; dynamic splitting remains a release optimization.

## Playable entries

- Current mother-monster combat demo: `http://127.0.0.1:5174/?quality3d=1&debug=1&combat=single-key-v3`
- Evolution presentation: `http://127.0.0.1:5174/?quality3d=1&evolution=1&auto=1&debug=1`

The `combat=single-key-v3` query label is an old demo URL label; the runtime profile returned by debug state is the accepted `coral-gecko-combat-master-v1`.

## Canonical documents

Read these when their area is in scope:

- `docs/DEVELOPMENT-LOG.md` — chronological implementation and validation record.
- `docs/EvolutionArena-Project-Docs-v0.1/README.md` — documentation map and current product direction.
- `docs/EvolutionArena-Project-Docs-v0.1/docs/art/19-CHARACTER-QUALITY-BASELINE.md` — accepted mother-monster quality contract.
- `docs/concepts/evolution-v2/coral-gecko/derived/PROCESSING.md` — model processing and GLB evidence.
- `public/assets/quality-3d/ASSET-NOTES.md` — runtime asset, source and usage notes.
- `docs/EvolutionArena-Project-Docs-v0.1/docs/reference/15-CODEX-HANDOFF.md` — broader engineering handoff.

## Important product decisions

- The game is not a snake-like arena. It is exploration, hunting and visible evolution across a large authored map.
- Evolution forms must change body plan, silhouette, color, scale and fantasy—not merely add small parts to the same body.
- Planned creature fantasies include small lizard to dragon, chick to phoenix, snake to dragon and cat to white tiger.
- Evolution is the principal selling point and should support at least six meaningful visible transformations in the current direction, with room for more later.
- Ground monsters stay on walkable ground; flying monsters must use believable flight/attack behavior such as diving to strike.
- Selected/locked target intent controls attacks. Do not attack unrelated creatures randomly.
- Skills, multiplayer and commercial-scale backend systems are later milestones and must not silently expand current work.

## Working state at handoff

- The accepted mother-monster implementation is on `origin/main` at `21e6031`. This context-only documentation may be a newer local commit; check Git status and log before starting work.
- The accepted mother-monster implementation and model are already on GitHub.
- No production deployment is involved; this is a local browser game prototype.
- The next task should inspect current Git state and choose one bounded milestone. Do not rebuild the completed mother monster from scratch.

## Suggested next-stage decision

Choose one, validate it end-to-end, then update this file:

1. Use the mother-monster contract to produce the next clearly different creature/evolution form.
2. Connect the accepted mother-monster combat/targeting presentation to the formal hunt scene.
3. Improve the authored map/terrain pipeline while preserving the accepted character scale and collision contract.

Do not start all three at once.
