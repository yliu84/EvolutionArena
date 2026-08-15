# Coral-crested gecko processing record

Status: playable web-game LOD and dedicated quadruped rig integrated into the Quality 3D trial.

## Outputs

- `coral-gecko-clean-high-v1.glb`: cleaned high-detail source, 320,506 triangles, original 2K PBR textures.
- `coral-gecko-meshy5-lod0-v1.glb`: web candidate, 54,997 triangles, 1K base-color/ORM/normal textures, approximately 6.7 MB.
- `runtime-preview-v1/`: neutral-light front, side, rear and gameplay-camera previews.
- `../../../public/assets/quality-3d/models/coral-gecko-lowpoly-v1.glb`: playable 32,000-triangle LOD with three 1K PBR textures (approximately 6 MB).
- `../../../public/assets/quality-3d/models/coral-gecko-rigged-v2.glb`: 20-bone skinned quadruped with `Idle`, `Run` and `Turn` animation clips.
- `../../../public/assets/quality-3d/models/coral-gecko-rigged-v3.glb`: accepted 21-bone mother-monster master with a weighted jaw plus `Idle`, `Run`, `Turn`, `Bite`, `Claw`, `TailSwipe`, `Hit` and `Death` clips.

## Cleanup

- Removed three detached floating geometry islands (1,120 faces total).
- Removed isolated one-to-ten-face debris.
- Preserved the complete tail, eyes, claws, crest and dorsal spines.
- Moved the mesh floor to local `Z = 0`.
- Rebuilt normals and tangents after decimation.

## Validation

- Clean high-detail GLB: 0 glTF errors, 0 warnings.
- Web candidate GLB: 0 glTF errors, 0 warnings.
- The stage-0 Quality 3D mapping now loads the playable LOD and falls back to the earlier procedural model if loading fails.
- glTF validation: 0 errors and 0 warnings after repairing two zero-length tangent vectors.
- Desktop 1440x900 and mobile landscape 844x390 browser checks passed; model source is `glb`, ground state is true, movement switches between `ProceduralIdle` and `ProceduralRun`, and no console warnings/errors were recorded.
- The rig contains four upper legs, four shins, four tracked feet, four tail joints, body, neck and head controls. Runtime testing confirmed `Idle`, `Turn` and `Run` crossfades, four detected foot bones and planted-foot error between 0.04 and 0.09 world units.
- Locomotion tuning v4 uses a 1.25 display scale, 31-degree upper-leg stride, stronger shin/foot lift and 3.2x `Run` playback. The pooled footfall dust now uses a 0.42-0.50 world-unit starting size, 0.62 peak opacity and a 0.58-second fade so its warm silhouette remains readable against the brown ground from the 19.2-unit open-map camera without becoming a smoke cloud.
- Weight/material tuning v5 keeps authoritative movement instant while easing only the visual mass response. It adds 0.22-second stop settle, footstep compression, contact-shadow darkening, stronger turn lean, head/tail follow-through and two-planted-foot dynamic root correction. A sharp-turn sample improved from 0.42 to 0.01 planted-foot error.
- The single loaded PBR material now uses roughness limits 0.52-0.88, normal strength 1.18, environment intensity 0.72 and texture anisotropy up to 8. The GLB has one normal-mapped material but no AO-mapped material; AO support is configured for later assets and is not counted as current visual detail.
- Accepted first-version ID `coral-gecko-master-v1` passed 1440x900 and simulated 844x390 browser checks at approximately 120/123 FPS, with zero console warnings/errors. The user visually accepted it on 2026-08-15 as the reusable V1 production baseline. A physical midrange-mobile 30 FPS test remains a separate public-release gate.
- Accepted combat-motion master v1 uses the 32,000-triangle web LOD, not the 320,506-triangle sculpt. The final V3 asset has 21 bones and eight named clips. The runtime maps Bite, Claw and TailSwipe to one ordered Space-key chain with a one-action input buffer and a 1.15-second idle reset, rather than exposing three player attack keys.
- The amplified combat pass preserves the same 32,000 triangles, 21 bones and eight clip names while increasing Bite jaw/lunge travel, Claw foreleg/torso travel and TailSwipe coil/sweep travel. The post-export tangent repair restored all three inherited zero-length tangent vectors; final glTF validation remains 0 errors and 0 warnings.
- Every basic-attack step now reacquires the live locked target and turns the character root toward it at 12 radians/second. Runtime contact requires no more than 8 degrees of aim error; the local animation cannot redirect authoritative damage.
- The runtime contact shadow is no longer one incorrectly scaled circle. It uses three body-plan ellipses (body, head and tail) and samples center/front/rear/left/right terrain height to remain visible on uneven ground and the stone bridge.
- User acceptance on 2026-08-15 promoted the full art, locomotion, combat, targeting, hit-feedback and validation contract to `coral-gecko-combat-master-v1`, the first mother-monster production reference for subsequent assets.
