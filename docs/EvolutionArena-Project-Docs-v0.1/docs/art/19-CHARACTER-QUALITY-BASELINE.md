# Character Quality Baseline — Coral Gecko v1

Status: **first-version character master visually accepted; physical-mobile release test remains open**  
Runtime baseline ID: `coral-gecko-master-v1`  
Playable entry: `?quality3d=1&debug=1`

This document turns the first playable coral gecko into a repeatable production template. It records what is already validated, what remains deliberately unfinished, and the gates every later monster and evolution form must pass.

## Sources of Truth

- Runtime tuning: `../../../../src/quality-3d-character-presentation.ts`
- GLB contract and stage mapping: `../../../../src/quality-3d-glb-assets.ts`
- Runtime model: `../../../../public/assets/quality-3d/models/coral-gecko-rigged-v2.glb`
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
| Rig | 20 bones, four tracked feet, four tail joints |
| Required clips | `Idle`, `Run`, `Turn` |
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
