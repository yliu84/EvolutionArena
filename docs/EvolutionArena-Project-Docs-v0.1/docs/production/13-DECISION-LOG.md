# Decision Log

## 2026-08-14 — Browser-first
**Decision:** v0.1 remains a web/browser game.

**Reason:** fastest sharing and lowest friction for gameplay validation. Current repository is already a TypeScript/Vite/Phaser project.

## 2026-08-14 — Single-player first
**Decision:** do not implement real-time multiplayer in v0.1.

**Reason:** multiplayer can amplify a good loop but can also conceal a weak one while greatly increasing engineering scope.

## 2026-08-14 — One fixed map with randomized ecology
**Decision:** use one handcrafted macro map; randomize spawn anchor, creature distribution, elites, rare resources and selected events.

**Reason:** players can learn geography while runs remain variable.

## 2026-08-14 — 24 visible species on six behavior archetypes
**Decision:** retain the current 24 visible species, but treat them as content variants across six shared attack archetypes rather than 24 unique AI pipelines.

**Reason:** the content already exists; the next value comes from polishing tells, skills and counters rather than adding more species.

## 2026-08-14 — Elites and bosses remain
**Decision:** retain elites and boss content already in development.

**Reason:** they create risk escalation and run climax. Keep the authored boss count small.

## 2026-08-14 — Six evolution stages
**Decision:** retain six stages.

**Reason:** gives the run a readable transformation arc. Exact biomass thresholds remain tunable.

## 2026-08-14 — Directed randomness
**Decision:** evolution resolves automatically after a readable preview and is strongly influenced by genes collected from chosen prey. One Resist per run delays growth; there is no three-choice draft.

**Reason:** this is the primary strategic differentiator.

## 2026-08-14 — Flexible validation length
**Decision:** target a 12–18 minute normal clear without a hard timer. Stage VI opens the boss decision; voluntary overgrowth raises world and boss pressure.

**Reason:** the player needs enough time to see six visible growth steps, but long-run save/cocoon systems are not justified until observed runs naturally exceed about 18 minutes.

## 2026-08-14 — Boss death ends the run
**Decision:** player death during the Rift Warden encounter ends the run like any other death. Free full-health retries are removed from validation mode.

**Reason:** the boss must remain a meaningful final risk and death/replay metrics must not be distorted.

## 2026-08-14 — Runtime terrain boundary
**Decision:** v0.1 uses one authored macro map. Procedural tools may help paint terrain and place props, but the game does not generate a new macro terrain every run.

**Reason:** ecology variation is cheaper and more learnable than fully procedural geography.

## 2026-08-14 — 2.5D stylized presentation
**Decision:** prioritize strong stylized visual quality compatible with browser performance.

**Reason:** visual evolution is central to product appeal, but frame pacing/readability outrank photorealism.

## 2026-08-14 — AI-assisted art
**Decision:** AI may generate concepts/assets, with human direction and technical cleanup.

**Reason:** reduces production burden for a solo developer, but consistency, topology, rigging, licensing and optimization still require validation.

## 2026-08-15 — True 3D creatures inside a 2.5D game
**Decision:** production creatures may use optimized rigged GLB models while the game retains an orthographic 2.5D camera, constrained navigation and browser-first performance budgets.

**Reason:** flat character images could not provide acceptable turning, grounding, material depth or evolution silhouettes. The coral-gecko slice proves the rendering and rigging path without changing the game into a free-camera 3D RPG.

## 2026-08-15 — One accepted character master before content batching
**Decision:** finish the coral gecko's material and weight gate, document it as the character-quality master, and only then produce other monsters and evolution forms from the same contract.

**Reason:** a single measured master prevents inconsistent scale, animation, topology and effects from being multiplied across the roster. Evolution forms must remain visibly different species rather than scaled copies with added parts.
