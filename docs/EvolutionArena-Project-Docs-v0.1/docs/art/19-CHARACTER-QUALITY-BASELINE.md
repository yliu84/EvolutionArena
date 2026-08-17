# Character Quality Baseline — Coral Gecko v1

Status: **first-version mother-monster master accepted; physical-mobile release test remains open**
Runtime baseline ID: `coral-gecko-master-v1`
Combat baseline ID: `coral-gecko-combat-master-v1`
Playable entry: `?quality3d=1&debug=1`

This document turns the first playable coral gecko into a repeatable production template. It records what is already validated, what remains deliberately unfinished, and the gates every later monster and evolution form must pass.

> Historical baseline notice: this page remains the immutable stage-0 mother-monster record. The current mandatory cross-species standard is `20-CREATURE-PRODUCTION-STANDARD-V2.md`, which incorporates the accepted same-world 3D camera, turn-before-move rule, stage-2 quadruped rig, heavy cadence, pooled dust, target combat and commercial acceptance matrix. When the two documents differ, v2 governs new production; this page continues to govern the accepted coral-gecko asset itself.

## Sources of Truth

- Runtime tuning: `../../../../src/quality-3d-character-presentation.ts`
- GLB contract and stage mapping: `../../../../src/quality-3d-glb-assets.ts`
- Runtime model: `../../../../public/assets/quality-3d/models/coral-gecko-rigged-v4.glb`
- Asset and license notes: `../../../../public/assets/quality-3d/ASSET-NOTES.md`
- Immutable source/provenance: `../../../concepts/evolution-v2/coral-gecko/source/SOURCE.md`
- Processing history: `../../../concepts/evolution-v2/coral-gecko/derived/PROCESSING.md`
- Latest desktop turn/grounding evidence: `../../../concepts/evolution-v2/coral-gecko/derived/runtime-preview-v1/in-game-weight-turn-v5.png`
- Latest mobile-landscape evidence: `../../../concepts/evolution-v2/coral-gecko/derived/runtime-preview-v1/in-game-weight-mobile-v5.png`
- Chronological implementation log: `../../../DEVELOPMENT-LOG.md`

Do not copy numbers from this Markdown file back into code. The typed runtime tuning file is authoritative; this page explains the design intent and acceptance state.

## Accepted v1 Data

| Area | Accepted value |
|---|---|
| Display scale | 1.25 |
| Gameplay camera | orthographic, 19.2 world-unit view height |
| Runtime mesh | 32,000 triangles, three 1K PBR textures, approximately 6.6 MB rigged GLB |
| Rig | 21 bones including an independently weighted jaw, four tracked feet and four tail joints |
| Required clips | `Idle`, `Run`, `Turn`, `Bite`, `Claw`, `TailSwipe`, `Hit`, `Death` |
| Playback | Idle 1.0x, Run 3.2x, Turn 1.2x, 0.16-second crossfade |
| Locomotion | 5.8 world units/second, 6.4 footstep events/second |
| Foot contact | maximum accepted planted-foot error 0.16; observed 0.07–0.08 in latest pass |
| Dust | 14 pooled sprites; 0.58-second lifetime; 0.42–0.50 start size; 0.62 peak opacity |
| Weight layer | eased visual acceleration/deceleration, 0.22-second stop settle, 0.018 step compression, head/tail turn follow and contact-shadow response |
| Dynamic grounding | two planted feet drive up to 0.48 world-unit root correction; sampled sharp-turn error reduced from 0.42 to 0.01 |
| Material layer | one PBR material tuned; one normal-mapped material at 1.18 strength; roughness clamped to 0.52–0.88; anisotropy up to 8 |
| Current AO limit | source GLB contains no AO-mapped material; AO support is configured but produces no false claimed detail |
| Latest performance sample | approximately 120 FPS at 1440×900 and 123 FPS in simulated 844×390 on the desktop GPU |
| Validation | 47 test files / 243 tests; GLB 0 errors / 0 warnings; browser console 0 errors / 0 warnings |

The mobile result is a responsive desktop-GPU viewport test, not proof of performance on a physical midrange phone.

## Accepted Weight and Material Master

The model is clearly three-dimensional, grounded and readable. The accepted first-version master combines:

1. **Material depth:** clearer scale normals, roughness control, restrained specular response and sharper texture filtering. A future GLB revision may add a real AO map; the current source does not contain one.
2. **Mass transfer:** visible chest/hip compression on planted steps, smaller vertical movement during airborne phases, and a short eased settle after stopping.
3. **Inertia:** the torso starts and stops before the tail fully settles; head and tail follow the body with a short, controlled lag instead of moving as one rigid object.
4. **Foot contact:** each planted foot drives a small body reaction, contact shadow change and existing dust event. Routine footsteps do not use hit-stop or camera shake.
5. **Turning:** feet and torso lead, head follows, tail counterbalances; rotation must remain responsive and cannot become an uninterruptible animation.

## Accepted Combat Motion Master

`coral-gecko-combat-master-v1` extends the accepted locomotion master without changing movement speed, collision or damage rules. The V3 GLB adds a weighted jaw bone and five one-shot combat/reaction clips:

- `Bite`: 0.60 seconds with anticipation, open jaw, forward head/body lunge, contact at approximately 0.30 seconds and recovery;
- `Claw`: 0.73-second alternating left/right foreclaw combo, with torso twist and contact at approximately 0.30 seconds;
- `TailSwipe`: 0.87-second coil, broad lateral sweep and recovery, with contact at approximately 0.40 seconds;
- `Hit`: 0.47-second side recoil with head, torso and tail follow-through;
- `Death`: 1.20-second collapse that holds its final grounded pose until reset.

The player has one primary-attack input: `Space`. Each press advances `Bite → Claw → TailSwipe → Bite`; pressing again before the current recovery ends buffers exactly one next attack, while holding Space continuously loops the same sequence. Waiting more than 1.15 seconds after recovery resets the sequence to Bite. Every combo step reacquires the current live locked target and turns toward it during anticipation; contact is rejected when the remaining aim error exceeds 8 degrees. The Quality 3D demo uses its sole training creature as that target, while the formal hunt must supply the player's selected/locked enemy rather than silently choosing an unrelated creature. `H`, `K` and `R` remain QA-only reaction/reset controls. The clips communicate state only; authoritative hit timing and damage remain owned by the Phaser combat system.

### Current combat-system boundary

`Bite`, `Claw` and `TailSwipe` are three animation variants in one **basic-attack chain**, not three skills. They share the single primary-attack input and the normal-attack authority. The current version has no mana/energy cost, skill slot, independent skill cooldown, skill targeting or skill upgrade tree. Skill attacks are a separate future system and must be designed and validated in their own milestone; they are intentionally disabled in this mother-monster master.

The quality demo includes one non-attacking armored training creature solely for validating this basic-attack chain. It exposes health, range, hit count, last action and death/respawn state in development diagnostics. A valid contact produces a short material flash, pooled impact fragments, restrained camera trauma and visual knockback; these presentation effects never calculate damage. The target cannot attack the player and is not part of the monster-content roster.

The amplified motion revision increases the readable silhouette rather than changing damage: Bite opens the jaw farther and roughly doubles the forward body drive; Claw lifts each foreleg higher with stronger torso twist and follow-through; TailSwipe increases both coil and lateral sweep across all four tail joints. Target-facing rotation remains authoritative at the character root, so these larger local bone motions cannot send the hit in a different direction.

### Attack deformation safety revision

The accepted identity and combat authority remain `coral-gecko-master-v1` and `coral-gecko-combat-master-v1`, but the current immutable runtime file is V4. V3 remains the preserved source master. V4 corrects a Jaw group that incorrectly included 4,183 strongly weighted vertices extending into the chest/forelimbs and limits inherited attack rotations that the automatic weights could not safely support.

Attack polish must not use non-uniform runtime root scale on this rig. During Bite, Claw and TailSwipe, the root stays at one scalar display scale and extra force comes from bounded root translation/rotation, contact timing, hit-stop and target reaction. Exported bone scale tracks must remain exactly 1.0. The debug contract reports `rootScale.x/y/z` and `maximumBoneScaleDeviation`; the accepted browser result is `1.25/1.25/1.25` and `0` respectively.

## Mother-Monster Master Acceptance

The user accepted this complete first-version mother-monster model on 2026-08-15. A future ground monster or evolution form may change its silhouette, materials, scale and attack vocabulary, but must inherit or deliberately replace this production contract:

- web-ready GLB budget, source/provenance record and validation with zero glTF errors or warnings;
- intentional model-to-map scale, grounded four-foot contact, body-plan contact shadow and terrain-safe collision footprint;
- named `Idle`, `Run`, `Turn`, basic-attack, `Hit` and `Death` clips with readable anticipation, contact and recovery;
- movement-speed-matched locomotion, target-facing attacks and authoritative contact timing separated from animation;
- visible health response, pooled hit feedback, visual-only knockback, death/reset behavior and development diagnostics;
- desktop and mobile-landscape browser checks with no new console errors and no P0/P1 defects.

This acceptance makes the coral gecko the production reference for subsequent monsters. It does not require every monster to reuse the same skeleton or animations, and it does not claim final mature-commercial artwork or physical midrange-mobile certification.

## Formal Hunt Integration Candidate

The accepted `coral-gecko-combat-master-v1` is now connected to the Phaser hunt scene as a bounded candidate awaiting user acceptance. The integration loads the deformation-safe V4 runtime derived from the preserved V3 source. A transparent Three.js overlay owns only model rendering and clip playback; Phaser remains authoritative for movement, collision, player-selected target identity, range, health, damage, knockback and death.

The formal entry keeps one basic-attack input and the accepted `Bite → Claw → TailSwipe` order. Each contact frame reads the current player-selected live target again, checks the action-specific Phaser range, and rejects contact above 8 degrees of facing error. Target death clears the lock and does not silently redirect the continuing presentation to another enemy. Skill attacks remain disabled.

The debug-only `Space QA普攻` control calls the same basic-attack request path and exists for deterministic browser validation; it is not a second combat input or a skill. The normal player control remains Space.

Candidate evidence: 48 test files / 248 tests, production build passed, V3 GLB 0 errors / 0 warnings, desktop 1440×900 and simulated mobile-landscape 844×390 checked with no console errors or warnings. Browser state observed the existing GLB clips in `Bite`, `Claw`, then `TailSwipe` order and retained the same selected target through contact. Physical midrange-mobile performance remains unverified.

The former single circle shadow has been replaced by three directional ellipses for the torso, head and tail. The ellipse axes now scale in the correct local plane, and five terrain samples lift the group just above the highest nearby surface so slopes and bridge edges do not cut it into a semicircle.

## Acceptance and Release Gates

The user visually accepted this first-version character master on 2026-08-15. That acceptance fixes the reusable art, scale, locomotion and material baseline; it does not claim mature commercial-game final quality.

Before a public release, the same master must still pass:

- normal-speed video shows no obvious foot sliding;
- start, stop and 90°/180° turns show readable weight transfer without input delay;
- the belly, feet and shadow remain grounded on slopes and bridge surfaces;
- scales, crest, belly and claws remain distinguishable at the real gameplay camera, not only in a close-up viewer;
- routine movement uses no camera shake or hit-stop;
- desktop remains at 60 FPS or better and a real midrange mobile device reaches 30 FPS or better (currently unverified on physical hardware);
- 1440×900 and 844×390 evidence, console results, GLB validation and tuning changes are recorded.

## Template for Every Later Creature or Evolution Form

Each asset receives its own immutable source folder, derived-processing record, typed runtime contract and evidence folder. Before integration it must define:

- unique `formId`, silhouette, threat/evolution role and gameplay scale;
- source service, date, license, original file hash and required attribution;
- triangle, texture, material and download-size budgets;
- named rig nodes and animation clips;
- ground/air locomotion rules and collision footprint;
- `Idle`, locomotion, `Turn`, primary attack, hit reaction and death clips; abilities add their own telegraph/active/recover clips;
- camera-distance screenshots and movement/combat video evidence;
- desktop, mobile, console, performance and GLB validation results.

Evolution forms are separate species silhouettes, not the same body enlarged with arbitrary attachments. Shared rigs are allowed only when the body plan genuinely supports the target silhouette and actions.

## Change-Control Rule

Every accepted tuning change must update, in the same task:

1. the typed runtime tuning or asset contract;
2. automated tests for stable values/contracts;
3. the processing record when the GLB changes;
4. the development log with observed evidence;
5. this baseline when acceptance status or production rules change.

## First Evolution Replacement Candidate

`scarlet-gecko-first-evolution-master-v1` and `scarlet-gecko-rigged-v1.glb` are preserved historical evidence. The user later rejected the visible V1 result during closer gameplay review: its reshaped body read as flat and rubber-like and its dark-red treatment did not provide the intended material richness. It must not be described as the current accepted appearance.

`scarlet-gecko-first-evolution-master-v2` is the accepted independent replacement. Its 19,406-triangle Meshy character mesh uses a 27-bone quadruped rig and nine clips: `Idle`, `Walk`, `Run`, `Turn`, `Bite`, `Claw`, `TailSwipe`, `Hit` and `Death`. A full chest, compact pelvis, continuous tail and integrated crown restore three-dimensional mass; coral-red, teal-jade and cream texture breakup remains readable under forest lighting without a crushed-black floor or metallic plastic response.

Stage 1 is connected to both the Quality 3D evolution viewer and MapLab 5. Its 1.661 display scale keeps the intended approximately 20% increase over the initial creature and a further 18% increase to stage 2. The current single-key chain is `Bite → Pounce → TailSwipe`, using the accepted grounded leap and 360-degree tail-spin envelopes while Phaser retains selected-target, range, damage, 8-degree contact and skill-disabled authority. This is a candidate pending user visual/gameplay acceptance, not a new master.

## Accepted Second Evolution Master

`scarlet-hunter-second-evolution-master-v1` is the accepted stage-2 master. The earlier v1 candidate was rejected because its lengthened, narrowed silhouette read as a flat sheet beside stage 1, its darkened texture collapsed toward black in forest lighting, and its attack rhythm merely inherited the first evolution. V2 rebuilt the body plan and material, while the accepted V3 runtime adds a readable independent jaw gape, snap and tear. It remains a separate 32,000-triangle GLB derived reproducibly from the accepted stage-1 master without overwriting either accepted asset.

The integrated v2 mesh uses a broad load-bearing chest, heavy pelvis, thicker tail root, compact body length and smaller crown-to-body ratio. Recalculated weights bind this anatomy to the existing 21-bone skeleton instead of stretching stage-1 weights over the new mass. Layered burnished crimson, copper-red highlights, pale underside breakup and preserved normal/roughness detail stay readable in actual forest shadow rather than relying on a black base.

The master preserves all eight named clips but gives stage 2 its own single-key normal-attack rhythm: `Claw → Bite → TailSwipe`, presented as `扑爪 → 重咬 → 尾砸`, with independent contact timing, playback, damage, range and feedback tuning. Every step still reacquires the selected target, faces it before contact and refuses a hit above 8 degrees. Skills remain disabled. Its display scale is 1.77, exactly 18% above stage 1's 1.50. Quality 3D stage 2 and the formal hunt both load `scarlet-hunter-rigged-v3.glb`; promotion to master changed identifiers and documentation only, not the accepted GLB or combat tuning.

### Low-poly cartoon direction candidate

The user later changed the creature art direction away from photoreal rendering after the accepted master showed noisy muscle/scale lines and fragile deformation in the new close 3D map camera. The accepted `scarlet-hunter-rigged-v3.glb` remains immutable as the previous-direction source master, while runtime stage 2 now evaluates the independent `scarlet-hunter-toon-v1.glb` candidate under baseline `scarlet-hunter-lowpoly-toon-candidate-v1`.

The candidate keeps the same body-plan identity, 1.77 display scale, 21-bone contract, eight named clips and combat profile while reducing the mesh to 7,999 triangles, using flat polygon normals, matte zero-metal material response and posterized large color bands with no normal-map microdetail. This conversion validates the new rendering language but does not yet claim final chunky anatomy: after visual acceptance, native low-poly reconstruction should replace further automatic decimation.
