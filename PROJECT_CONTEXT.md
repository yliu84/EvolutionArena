# Evolution Arena Lite — Project Context

Last updated: 2026-08-20
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
npm run validate:gltf -- public/assets/quality-3d/models/coral-gecko-rigged-v4.glb
```

## Current accepted milestone

The coral-crested gecko is the first completed mother-monster production reference.

## Active player route — Goal 6A

The **bare live entry now opens Gloamwood Valley**, the river-valley vertical slice. The compact Gloamwood nest remains reachable only with `?map=gloamwood` for focused legacy combat checks.

Goal 6A is the current acceptance pass for a player’s first minutes, not a map-art rewrite:

- river-valley start has a two-step, low-coverage guide and an 18-second / 14-metre calm-reading window; a strike still wakes its target immediately;
- valley tree trunks and loose boulders now share their physical footprints with the rendered scatter; cliffs and vegetation remain visual/terrain-confined rather than becoming frustrating invisible walls;
- all valley starting creatures receive body plus combat-action clearance, including cross-group pairs, before their first frame;
- `?debug=1&bossGate=1&bossIndex=0..2` chooses a real evolution, then places the reviewer at the corresponding river-valley region Boss (not the retired Gloamwood arena);
- compact phone landscape HUD exposes only live combat data; Genes and milestone totals stay behind `More info`.

Official local acceptance entry: `http://127.0.0.1:<vite-port>/?debug=1&evolutionSeed=goal6a&mapSeed=goal6a`.
For the first Boss: append `&bossGate=1&bossIndex=0`. Do not use a `?maplab=5` or `?quality3d=1` URL for this acceptance.

Runtime identifiers:

- character/material/locomotion baseline: `coral-gecko-master-v1`
- combat baseline: `coral-gecko-combat-master-v1`
- runtime model: `public/assets/quality-3d/models/coral-gecko-rigged-v4.glb` (deformation-safe revision; V3 source preserved)

Accepted model contract:

- 32,000-triangle browser LOD with documented source and processing history;
- 21-bone quadruped rig with weighted jaw, four tracked feet and four tail joints;
- named `Idle`, `Run`, `Turn`, `Bite`, `Claw`, `TailSwipe`, `Hit` and `Death` clips;
- four-foot grounding, terrain height correction, terrain-safe body footprint and three-part contact shadow;
- movement-matched running, real turning, tail inertia, dust and material/weight response;
- a single Space-key stage-0 basic-attack chain: `Bite → Pounce → TailSwipe` (`快速撕咬 → 跃起重咬 → 尾扫`); the logical Pounce reuses the deformation-safe Bite clip and adds root-only crouch, launch, contact and landing motion;
- one buffered next attack and a 1.15-second idle combo reset;
- each attack step reacquires the live locked target, turns at 12 radians/second and refuses contact above 8 degrees of aim error;
- authoritative attack timing/range/damage separated from animation;
- pooled impact fragments, brief flash, restrained camera trauma and visual-only knockback;
- non-attacking armored training creature with health, death and 1.8-second respawn for demo validation;
- debug evidence for action, targeting, health, range, hit/death counts, grounding, asset state and FPS.

The three attack animations are ordinary attacks, not skills. The skill-attack system has not started and remains explicitly disabled.

## Latest validation evidence

- Production build passed; Vite still reports the existing chunks larger than 500 kB.
- Vitest: 70 test files and 386 tests passed, including the 3D-map routing, signed camera-relative four-way movement, stage-aware oriented world and living-entity collision, turn-before-move/cardinal-facing rules, stage-1 core-spine locomotion stabilization, clamped one-shot cleanup before locomotion, presentation motion, deformation-safe stage-0/1 GLB contracts, ground-safe visible leap-bite envelope and full-spin tail-swipe envelope, route-specific combat styles, all 13 random-evolution endpoints and the complete three-wave ecological nest authority.
- The native stage-2 source and rigged runtime GLBs both have zero glTF errors and warnings; the rigged candidate reports 14 non-blocking validator infos and zero hints.
- Desktop 1440×900 passed at approximately 115–120 FPS; simulated mobile landscape 844×390 passed at approximately 69 FPS on the development machine, with no HUD overflow and 44-pixel-or-larger touch controls.
- Browser console/page errors: zero in the latest accepted pass.
- Stage-0 deformation repair: V4 GLB validates at 0 errors/0 warnings/0 infos/0 hints. A clean browser tab loaded the V4 cache tag and completed `Bite → Claw → TailSwipe` with health 84→68→56→42, grounded=true, aim error 0, root scale 1.25/1.25/1.25, maximum bone-scale deviation 0 and no console errors/warnings.
- Stage-0 short-foreleg combat revision: the current runtime chain is `Bite → Pounce → TailSwipe`. Browser sampling confirmed crouch, airborne launch, forward bite contact and compressed recovery; the leap strike dealt one authoritative 18-damage contact, emitted four enhanced landing-dust sprites, kept root scale at 1.25/1.25/1.25 and maximum bone-scale deviation at 0, and produced no console errors or warnings at desktop and 844×390.
- Stage-0 grounding/spin revision: leap recovery no longer lowers the complete rig below terrain; grounded phases re-enable foot correction and sampled recovery clearance is approximately -0.01 with 0.01 planted-foot error. TailSwipe now coils to about -25°, crosses the locked target tail-first at 180°, completes 360° and returns to zero without changing authoritative facing, damage, range or the 8-degree rule.
- Reverse-facing attack test started around 74 degrees away from the target, reached zero aim error before contact and applied damage correctly.
- Stage-2 browser validation confirmed the 1.77 scale, grounded state, full three-hit cycle, formal-hunt swap, disabled skills and rejection of an 11.38-degree off-angle contact.
- Random-evolution browser validation confirmed distinct pure and hybrid endpoint identities/stats, procedural multi-family fallback, locked Apex identity, responsive layouts and zero console errors/warnings.
- The former Formal-map V4 gameplay checks remain historical evidence only; the user rejected its map presentation and it must not be described as an accepted formal region.
- New-map browser validation confirmed real 3D geometry, no flat backdrop, 42 trees, 33 rocks, 13 shrine pieces and 83 collision obstacles. Visible tree roots, full rock extents and the complete 5.8-radius shrine base are solid; player collision uses stage-aware front/body/rear probes, resolves clustered contacts iteratively and also applies to turning and enemy knockback. A real stage-2 click-move test stopped on `rock-1` with `minimumClearance=0` and no visible overlap.
- Known release gap: a real midrange mobile device must still demonstrate stable 30 FPS.
- Known bundle follow-up: Vite still reports chunks larger than 500 kB; dynamic splitting remains a release optimization.
- Goal 2 desktop browser validation completed the full three-wave nest with 11 kills, 76 Biomass and Fang/Shell/Swarm genes at 3/2/6. Independent 844×390 headless-Chrome validation confirmed visible touch controls, a 270×165 HUD outside the central combat area and zero console/page errors.

## First evolution replacement candidate

The original first evolution was accepted on 2026-08-15, then rejected after closer gameplay review because the body appeared flat and rubber-like and its color/material response no longer met the current art direction. Its GLB remains preserved; it is not the current runtime candidate.

- form: `scarlet-gecko` / 赤冠壁蜥
- current character baseline: `scarlet-gecko-first-evolution-master-v2` (user-accepted gameplay master)
- combat profile: `scarlet-gecko-combat-master-v1`
- runtime model: `public/assets/quality-3d/models/scarlet-gecko-rigged-v2.glb`
- preserved historical model: `public/assets/quality-3d/models/scarlet-gecko-rigged-v1.glb`
- contract: 19,406 character triangles, 27 bones and nine named movement/combat/reaction clips
- shape: independent volumetric Meshy quadruped with a full load-bearing chest, compact pelvis, continuous tail and integrated crown; coral, teal-jade and cream material breakup
- display size: 1.661, approximately 20% above stage 0 and 18% below stage 2; authoritative collision and combat ranges are unchanged
- integration: Quality 3D stage 1 plus automatic stage-1 presentation swap in the formal Phaser hunt
- combat boundary: one selected-target `Bite → Pounce → TailSwipe` basic chain using the accepted grounded leap and 360-degree tail-spin language; skills remain disabled
- status: runtime and offline checks passed; V2 must remain a candidate until the user completes visual and gameplay acceptance
- current gait/material revision: Run playback 1.45, authored limb delta amplification 1.22, 5.8 foot-contact events/second, 0.18 texture-based emissive fill instead of the source's full-strength self-lighting, a 1.16 contrast / 1.24 saturation surface grade, warmer/deeper semi-matte response and runtime SHA-256 `100c5e3d222650951828ea0aef3d308d9d91e1ac54c2aaa43c681877ad69b314`
- current control/spacing revision: keyboard and touch are camera-relative with screen-right defined by `camera-forward × world-up`, translation waits for the 6-degree facing gate, and typed player/prey body radii prevent travel, chase and attack approach from stacking living bodies
- current stage-1 Pounce revision: horizontal presentation travel remains 0.32 to protect entity spacing, while independent vertical lift is 1.65 for an observed approximately 0.49-unit airborne peak
- current stage-1 Run stabilization: source core yaw reached approximately 11–16 degrees despite parent facing error 0; runtime Run/Walk clones retain pitch and limb motion but scale Hips/chest/head yaw to 0.22 and roll to 0.18 so sustained W remains visually screen-aligned
- current post-combat transition: entering Idle or Run stops every other animation action, preventing a clamped one-shot attack/death/hit pose from remaining mixed under later W movement

## Accepted second evolution

The completed second evolution is an independent stage-2 model and does not replace the accepted stage-0 or stage-1 GLBs.

- form: `scarlet-hunter` / 赤爪猎龙
- previous-direction source baseline: `scarlet-hunter-second-evolution-master-v1`
- rejected runtime study currently visible in the test map: `scarlet-hunter-native-toon-rejected-v2`
- accepted replacement design target: `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/scarlet-hunter-production-target-v2.png`
- production contract: `docs/concepts/evolution-v2/scarlet-hunter/PRODUCTION-MODEL-CONTRACT-V2.md`
- combat profile: `scarlet-hunter-combat-master-v1`
- preserved source model: `public/assets/quality-3d/models/scarlet-hunter-rigged-v3.glb`
- current runtime model: `public/assets/quality-3d/models/scarlet-hunter-native-toon-rigged-v2.glb`
- contract: 3,480 runtime triangles, 21 bones and all eight required named clips; the preserved realistic source master remains 32,000 triangles
- shape: rounded from-scratch cartoon hunter-drake with large chest/head/jaw masses, short load-bearing legs, oversized beveled feet, one continuous tapered tail, simplified crown and large amber eyes; organic surfaces use smooth normals while crown, claws and route plates keep graphic hard edges
- display size: 1.77, exactly 18% above the accepted stage-1 scale of 1.50
- integration: Quality 3D stage 2 and automatic stage-2 presentation swap in the formal Phaser hunt
- combat boundary: one selected-target stage-2 chain, `Claw → Pounce → TailSwipe` (`裂爪 → 双爪跃扑 → 旋身尾扫`), with independent timings and feedback; Pounce shares the ground-safe launch/landing contract and TailSwipe shares the 360-degree spin contract, while stage-2 damage and authored claw motion remain form-specific; the 8-degree contact tolerance remains and skills stay disabled
- status: the realistic V3 master and 7,999-triangle derived toon study are preserved. Native V1 and V2 are both rejected: V1 exposed coarse facets and V2 became a balloon-like smooth primitive construction with unreadable inherited attacks. The user accepted the new production design board; a form-specific model, armature, weights and attack set must now be built against its written contract before another runtime candidate is presented.

The Quality 3D presentation now uses a 48-degree perspective camera at a 29-degree pitch and 10.6-unit distance, with a critically damped player focus, camera leash and teleport snap. A soft player-following fill light, broken-waygate landmark and atmosphere motes improve volume and scene depth without changing the accepted GLBs. Valid stage-2 contacts add distinct pooled claw, bite and tail arcs plus brief visual hit stop; authoritative damage, selected-target facing, the 8-degree rule and disabled skills are unchanged.

## Accepted Shell first evolution

The first non-Fang player form, and the first creature produced specifically to measure the production line's real cost.

- form: `stone-pangolin` / 叠岩甲蜥
- character baseline: `stone-pangolin-shell-first-evolution-master-v1`
- combat profile: `stone-pangolin-combat-master-v1`
- runtime model: `public/assets/quality-3d/models/stone-pangolin-rigged-runtime-v2.glb`
- contract: 20,391 triangles, 27 bones and the nine named clips, sharing the Meshy quadruped rig template and node names with the accepted stage-1 gecko
- shape: a low, broad mound of overlapping stone plates covering back, flanks and tail, four legs clear of the plate skirt, head tucked under the leading rim
- **form-specific sizing, not stage-based**: world height 1.80 rather than the stage-1 2.16, giving 1.58 x 4.57 against the Fang form's 1.56 x 3.99. Normalising a low, long body by height alone would otherwise inflate it to 6.98 long. Growth over stage 0 reads as breadth and mass at equal height, so evolving never looks like shrinking.
- typed data: `GLOAMWOOD_3D_FORM_WORLD_HEIGHTS` and `GLOAMWOOD_PLAYER_FAMILY_COLLISION_PROFILES` carry the per-family overrides; the stage tables are unchanged for every other form
- combat boundary: `Bite → Slam → TailSwipe` on the one primary input. Pounce is deliberately absent because short stout forelimbs and a low head cannot sell a leap. Slam is a clip redirect only; damage, range, timing and the eight-degree contact rule are the existing authority untouched. Skills remain disabled
- production cost: 3 source attempts and 2 rig attempts to a usable asset, against 13 GLBs for the stage-2 hunter. The expensive part was integration, not modelling, and most of those fixes were architectural and are now reusable
- contract: `docs/concepts/evolution-v2/shell-stage1/PRODUCTION-MODEL-CONTRACT-V1.md`

## Evolution models are keyed by gene family

`QUALITY_3D_GLB_ASSETS` carries an optional `family`, and `resolveQuality3DGLBAsset(stage, family)` prefers the exact family, then a route-independent form, then the stage default. It returns `matchedFamily`, which debug state reports, so a route wearing another family's body is visible rather than silent.

Before this, choosing Shell or Swarm silently loaded the Fang body: three evolution choices presented one creature. Fang and Shell now own separate bodies. Swarm stage-1 design is locked to concept B (`brood-stalker` / 荧囊猎蜥) and is waiting on a user-run Meshy Image-to-3D job; until that GLB is accepted it still borrows another body and still receives the procedural evolution accent, which is created only when a route has no body of its own.

## Swarm first evolution — design locked, awaiting source

The third stage-1 body. No runtime GLB yet.

- form: `brood-stalker` / 荧囊猎蜥 (Chinese name not locked for HUD strings)
- contract: `docs/concepts/evolution-v2/swarm-stage1/PRODUCTION-MODEL-CONTRACT-V1.md`
- Meshy pack: `docs/concepts/evolution-v2/swarm-stage1/source/SOURCE.md`
- primary image: `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/swarm-stage1-concept-b-flank-sac-three-quarter.png`
- shape lock: compact — tall on solid slender legs, short torso, short tail; cyan spore sac high on the upper flank just below the spine, readable from above. Not a biped, not a gecko crawler, not a pangolin, no floating orbs, no long whip tail
- intended combat chain after the mesh lands: `Bite → Pounce → TailSwipe` (long hind legs can sell a leap; do not inherit Shell's Slam)
- do not start Blender until the downloaded mesh passes the silhouette gates in the contract

Form-specific handling must key on `formId` or family, never on stage. Three separate defects came from stage-keyed branches: the scarlet-gecko locomotion stabiliser flattening other stage-1 motion, the scarlet-gecko material grade tinting and flattening the Shell body, and debug state reporting the wrong baseline and triangle count.

## Random branching species system v1

The gameplay evolution graph is no longer a universal stage-only art ladder. `src/evolution-species.ts` defines 20 core species—one origin, six family lineages, six pure Apex species and seven curated hybrid Apex species—with 13 reachable endpoints.

- resolution key: completed stage plus dominant gene family plus an optional compatible secondary family
- direction source: recent hunts remain 60% of gene tendency and cumulative genes remain 40%; seeded mutation randomness and wild pressure are preserved
- mechanics: every Apex has a distinct authoritative stat result plus a declared normal-attack profile, locomotion profile, passive and cost; route identity now selects the real melee, ranged or magic ordinary-attack authority used in combat
- endpoint lock: the stage-6 species ID and capstone stats cannot be rewritten by later overgrowth genes
- presentation: accepted stage-0, Fang stage-1/2 and Shell stage-1 GLBs remain immutable; Swarm and all endpoints above stage 2 still use modular procedural validation silhouettes
- skills: stage 0 and Fang stage 1 use `Bite → Pounce → TailSwipe`; Fang stage 2 uses `Claw → Pounce → TailSwipe`. All three share the deformation-safe leap/landing and 360-degree tail-spin presentation contracts while retaining stage-specific timing, damage and first-strike anatomy. They remain locked-target ordinary attacks with the 8-degree contact rule. Later route forms use their resolved melee, ranged or magic ordinary attack, while the separate skill-attack system remains disabled
- detailed matrix: `docs/EvolutionArena-Project-Docs-v0.1/docs/design/20-RANDOM-EVOLUTION-SPECIES-MATRIX.md`

## Playable entries

- Current commercial vertical-slice entry: `http://127.0.0.1:5174/?maplab=5&debug=1&evolutionRoute=fang&evolutionStage=2`
- Shell first evolution, straight into the free-movement hunt: `http://127.0.0.1:5174/?maplab=5&debug=1&evolutionRoute=shell&evolutionStage=1`
- MapLab 5 now reads `evolutionRoute` (`fang` / `shell` / `swarm`) as well as `evolutionStage`, so any form can be loaded for footprint and traversal checks without playing to the evolution
- Current mother-monster combat demo: `http://127.0.0.1:5174/?quality3d=1&debug=1&combat=single-key-v3`
- Formal mother-monster hunt candidate: `http://127.0.0.1:5174/?maplab=4&live=1&mother=1&debug=1&nest=thorn-burrow`
- Evolution presentation: `http://127.0.0.1:5174/?quality3d=1&evolution=1&auto=1&debug=1`
- First-evolution viewer: `http://127.0.0.1:5174/?quality3d=1&evolution=1&debug=1` then select stage 1
- Formal first-evolution hunt: `http://127.0.0.1:5174/?maplab=4&live=1&mother=1&debug=1&nest=thorn-burrow&evolutionRoute=fang&evolutionStage=1`
- Second-evolution viewer: `http://127.0.0.1:5174/?quality3d=1&evolution=1&debug=1` then select stage 2
- Formal second-evolution hunt: `http://127.0.0.1:5174/?maplab=4&live=1&mother=1&debug=1&nest=thorn-burrow&evolutionRoute=fang&evolutionStage=2`
- Formal-map safe-start acceptance entry: `http://127.0.0.1:5174/?maplab=4&live=1&mother=1&debug=1&evolutionRoute=fang&evolutionStage=2`
- Pure random-route Apex example: `http://127.0.0.1:5174/?maplab=4&live=1&debug=1&nest=thorn-burrow&evolutionRoute=wing&evolutionStage=6`
- Hybrid random-route Apex example: `http://127.0.0.1:5174/?maplab=4&live=1&debug=1&nest=thorn-burrow&evolutionRoute=rift&evolutionSecondary=swarm&evolutionStage=6`

The `combat=single-key-v3` query label is an old demo URL label; the runtime profile returned by debug state is the accepted `coral-gecko-combat-master-v1`.

## Canonical documents

Read these when their area is in scope:

- `docs/DEVELOPMENT-LOG.md` — chronological implementation and validation record.
- `docs/COMMERCIAL-VERTICAL-SLICE-ROADMAP.md` — five gated Goals from first encounter through commercial-quality validation.
- `docs/GOAL-4-ACCEPTANCE.md` — requirement-by-requirement Goal 4 evidence and the remaining natural-run / 844×390 acceptance procedure.
- `docs/GOAL-5-ACCEPTANCE.md` — active commercial-quality gate, current evidence and remaining release/usability requirements.
- `docs/GOAL-6A-ACCEPTANCE.md` — current first-minutes, river-valley entry and mobile-HUD acceptance procedure.
- `docs/EvolutionArena-Project-Docs-v0.1/README.md` — documentation map and current product direction.
- `docs/EvolutionArena-Project-Docs-v0.1/docs/art/19-CHARACTER-QUALITY-BASELINE.md` — accepted mother-monster quality contract.
- `docs/EvolutionArena-Project-Docs-v0.1/docs/art/20-CREATURE-PRODUCTION-STANDARD-V2.md` — mandatory current standard for every new creature, evolution form and Boss; includes version/upgrade policy.
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
- The former MapLab V4 formal-hunt map was rejected by the user and is no longer an acceptance or production base. Its code and assets remain only as recoverable historical tooling; do not resume polishing its stretched flat background.
- Live `maplab=4` requests now route to a new same-world Three.js 3D map candidate. It uses separate immutable GLBs at stage 0, stage 1 and stage 2 in the same 3D coordinate system as terrain, props and shadows, eliminating the former transparent-overlay grounding mismatch.
- Stage 0 is the shared origin and the stage-1/2 GLBs belong to the Fang path; Shell now owns its own stage-1 body. Swarm and every stage above 2 deliberately fall back to route-aware procedural modular presentation until their own GLBs pass the character baseline.
- Its single basic-attack input and debug QA trigger select the profile for the active form: stages 0 and 1 execute `Bite → Pounce → TailSwipe`, while stage 2 executes `Claw → Pounce → TailSwipe`. Pounce uses the shared terrain-safe leap/landing envelope, TailSwipe uses the shared -25° anticipation / 180° contact / 360° completion spin, and each form keeps its own timing, damage, scale and compatible authored clip. Every contact checks the same live selected target, action-specific range and the accepted 8-degree aim tolerance. Skills remain disabled.
- No production deployment is involved; this is a local browser game prototype.
- Preserve the accepted scarlet-gecko master while developing stage 2; do not reuse or overwrite its runtime GLB.

## Rejected Formal Gloamwood region vertical slice V4

The user rejected this region because its stretched flat backdrop, spatial language and character integration were not usable. The prior completion/acceptance claim is withdrawn. Keep it only as historical reference for the eight authored nests, six route families and combat rules.

- fullscreen responsive HUD: health, form/species, stage progress, dominant random-gene tendency, objective compass/distance, selected target, encounter event, boss gate and two-phase boss health;
- touch-safe actions: selected-target cycle, the same single primary attack, resist-random-growth and pause; no skill slots were added;
- pause/resume/restart plus existing death and victory results;
- accepted 48-degree FOV, 29-degree pitch and 10.6-distance perspective baseline migrated to the formal GLB presentation, with a presentation-only scale correction that does not change collision, range or stage ratios;
- upgraded deterministic Rift Warden silhouette and preserved authoritative two-phase patterns;
- Phaser remains authoritative for the complete loop; the DOM HUD and Three.js overlay only present state.

Do not present this V4 slice for acceptance again.

## Gloamwood same-world 3D rebuild candidate

The replacement entry is `http://127.0.0.1:5174/?maplab=5&debug=1&evolutionRoute=fang&evolutionStage=2`. For continuity, the old live URL also routes to this scene.

- real Three.js terrain geometry instead of a world-sized painted background;
- separate textured hunt path, 3D trees, rocks, shrine geometry, real-time light, fog and shadows;
- typed solid-world obstacles and click/WASD navigation: trees include their visible roots, rocks use their widest mesh extent, the full shrine base is blocked, and stage-aware oriented front/body/rear probes prevent larger evolutions from entering geometry during travel, turning or knockback;
- stage-0/1/2 GLB loading into the same world coordinate system;
- automatic model grounding, three contact-shadow layers, authored diagonal Walk/Run cycles at full animation weight, tail inertia and stop settle;
- stage-aware presentation heights of 1.80 / 2.16 / 2.55 preserve the accepted +20% and +18% growth steps, while the 20.08-unit combat camera reduces stage-2 screen occupancy without changing collision, movement speed or hit ranges;
- commercial Goal 1 now adds click/Tab target lock, the existing form-specific one-button basic combo, live range plus 8-degree contact checks, player/enemy health, damage, knockback, death and deterministic respawn;
- the first encounter enemy is a code-built Thornback training beetle with chase, telegraph, strike, recover, stunned, dead and respawning authority states. Its ring, flash, slash marks, hit stop and camera trauma are presentation-only consumers of confirmed combat events;
- keyboard, click-to-move and landscape touch controls share the same turn-before-move and attack authority. Skills remain disabled. The rejected V4 nest loop, random-evolution run state and Boss have not yet been migrated.
- stage-2 locomotion keeps the authored GLB leg and foot curves at full weight with zero additive limb rotation, but now layers a stronger whole-body lift/plant compression, fore-aft body rock, stop settle and small presentation-only footstep trauma. Alternating discrete foot plants drive a pooled 36-sprite ground-dust system; particles never decide speed, collision or contact.

## Commercial Goal 2 ecological nest

The MapLab 5 vertical slice now contains one complete clearable Corrupted Brood Nest instead of the Goal 1 respawning training beetle.

- authority: deterministic dormant, wave, intermission and cleared nest phases; three waves with a six-prey active cap and no combat-simulation dependence on Three.js presentation;
- Fang pressure: two fast, short-telegraph melee hunters in wave 1, with Claw as the favorable normal-attack matchup;
- Shell defense: a broad slow high-health shield creature whose frontal sector reduces incoming damage by 72%, while rear/flank hits deal 135%;
- Swarm numbers: small low-health orbiting creatures that surround in groups and take 30% additional TailSwipe damage;
- escalation: wave 1 is two Fang, wave 2 is one Shell plus two Swarm, wave 3 is one Fang, one Shell and four Swarm;
- rewards: each authority-confirmed death grants exactly one family Gene and species Biomass. A complete clear yields 11 kills, 76 Biomass and 3 Fang / 2 Shell / 6 Swarm Genes;
- usability: click or Tab cycles only living prey, the HUD exposes target health/state/weakness, wave progress and rewards, and player death returns surviving prey to the nest before a protected respawn;
- boundaries: the accepted player GLB, one-button form-specific basic combo, 8-degree contact rule and disabled skill system are unchanged.

## Active next-stage decision

Commercial vertical-slice Goals 1-4 are user-accepted. Goal 5 is developed but **not closed**: `docs/GOAL-5-PLAYTEST-RECORD.md` still has no physical-device `PERF` reading and no outside no-instruction playtest. Those two remain the honest acceptance gates, and the roadmap makes them the input that decides whether the map and species lines expand at all.

The Shell first evolution was completed and accepted on 2026-08-17 as the first measurement of production cost. Swarm stage-1 concept B was accepted the same day as the modelling target; the source GLB does not exist yet.

Valley gate-1 boss design was locked on 2026-08-18 to concept C (rim visor) as `tide-cleaver` / 溯流刀甲. This is the first modelled boss in the project; 荆心守卫 remains primitives and 腐根巢卫 remains a scaled Shell grunt until a passing source exists. Meshy pack: `docs/concepts/valley/tide-cleaver/source/SOURCE.md`. Do not start Blender until that mesh passes the contract gates. Valley map implementation is still a separate, unaccepted spec.

Recommended order from here:

1. Close Goal 5 - capture the `PERF` line on a real mid-range phone, then run at least three strangers with only the URL. The key question is whether they notice their creature became a different animal.
2. In parallel, the user runs Meshy Image to 3D from the Swarm pack and, separately, from the 溯流刀甲 pack. Do not start Blender on either until that mesh passes its contract gates. A passing Swarm body is the second player-form production-cost data point (Shell was 3 source + 2 rig). A passing 溯流刀甲 body is the first modelled-boss cost number.
3. Two player-form points give the slope that decides whether the species matrix is produced in full or cut. The boss number decides whether valley's three modelled bosses are affordable.

**Open design question, raised by the user on 2026-08-17 after their own playthrough**: the run is two minutes long and contains exactly one decision, so the three evolution routes read as skins. `docs/design/MUTATION-LOOP-PROPOSAL-V1.md` proposes the answer - splitting evolution into a cheap mutation layer that changes rules rather than percentages, and the existing expensive form layer - and argues for building the mutation layer first because it is the only change that tests whether players want a second run without spending any art. Proposal only; not implemented.

`docs/design/OPEN-MAP-RUN-STRUCTURE-V1.md` proposes the run structure the open map needs, and exists because depth has to be real before it can gate anything. Its core move: mutations unlock on depth rather than on biomass, because biomass is unbounded on an open map and gating on it means whoever grinds gets stronger without limit. It builds on the eight MapLab 4 nest archetypes already authored in art and data, whose core health ladder of 18 to 30 is already a difficulty curve, and whose existing `heal` reward keeps healing an earned reward rather than a scattered pickup that would undo the life budget. Proposal only; not implemented.

Open and unclosed, carried forward:

- Meshy commercial licence evidence is still unarchived. The Shell job selected the private licence; record it in `docs/concepts/evolution-v2/shell-stage1/source/SOURCE.md`. This is a release blocker, not a technical one.
- A small static seam remains between two plates at the top of the Shell body. It is a mesh seam present in the rest pose, not a rigging fault, and is not resolvable at the 13.3% screen height the standard records.

Per the user's standing instruction, do not modify the map environment, assets, shrine, lighting or vegetation; that is an independent workflow. Skills remain disabled.
