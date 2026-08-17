# Coral-crested gecko processing record

Status: playable web-game LOD and dedicated quadruped rig integrated into the Quality 3D trial.

## Outputs

- `coral-gecko-clean-high-v1.glb`: cleaned high-detail source, 320,506 triangles, original 2K PBR textures.
- `coral-gecko-meshy5-lod0-v1.glb`: web candidate, 54,997 triangles, 1K base-color/ORM/normal textures, approximately 6.7 MB.
- `runtime-preview-v1/`: neutral-light front, side, rear and gameplay-camera previews.
- `../../../public/assets/quality-3d/models/coral-gecko-lowpoly-v1.glb`: playable 32,000-triangle LOD with three 1K PBR textures (approximately 6 MB).
- `../../../public/assets/quality-3d/models/coral-gecko-rigged-v2.glb`: 20-bone skinned quadruped with `Idle`, `Run` and `Turn` animation clips.
- `../../../public/assets/quality-3d/models/coral-gecko-rigged-v3.glb`: accepted 21-bone mother-monster master with a weighted jaw plus `Idle`, `Run`, `Turn`, `Bite`, `Claw`, `TailSwipe`, `Hit` and `Death` clips.
- `../../../public/assets/quality-3d/models/coral-gecko-rigged-v4.glb`: deformation-safe runtime revision of V3. It keeps the 32,000-triangle, 21-bone and eight-clip contract while correcting the inherited Jaw weight spill and unsafe Bite/Claw rotations.

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

## Attack deformation repair v4

The V3 source is preserved. `scripts/blender/repair_coral_gecko_attack_deformation.py` reproducibly imports V3, moves the original broad Jaw influence back to Head, returns only a smooth lower-snout wedge to Jaw, limits unsafe inherited attack rotations, fixes every exported bone scale key to 1.0 and exports V4 with the skinned mesh as a glTF root.

The repair was driven by five offline contact-pose renders rather than idle inspection alone. Claw no longer produces a pole-like forelimb; Bite gape/contact/tear no longer pull the chest or forelimbs into sheets; TailSwipe remains stable. The runtime additionally forces one scalar root scale during stage-0 attacks and uses only root translation/rotation for extra attack readability. Debug state exposes the three root-scale axes and maximum bone-scale deviation.

V4 evidence: SHA-256 `10253a240935edb5ca6946b4ee18cc9a77b74b38b1300be6c474cc82cb934801`; 32,000 triangles; 21 bones; eight required clips; glTF validator 0 errors, 0 warnings, 0 infos and 0 hints. Browser input completed `Bite → Claw → TailSwipe`, reduced the training target from 84 to 42, stayed grounded, held 0-degree aim error, reported root scale `1.25/1.25/1.25` and maximum bone-scale deviation 0, with no clean-tab console errors or warnings.

The later stage-0 combat revision preserves this exact V4 GLB and replaces the unsuitable short-foreleg Claw slot at runtime with a logical Pounce displayed as `跃起重咬`. It reuses the safe Bite clip at 0.78 playback rate while a root-only envelope provides backward load, launch, 0.78-unit forward travel, 0.30-unit lift and nose-down contact. The contact remains authoritative at 0.43 seconds with the accepted live-target, range and 8-degree checks. Landing emits four pooled high-intensity dust sprites plus restrained camera trauma; grounded phases re-enable tracked-foot correction instead of lowering the complete rig below terrain. Root scaling stays uniform and no leg/foot/jaw bone is edited at runtime. Desktop and 844×390 sampling reported one 18-damage contact, one landing event, four landing puffs, approximately -0.01 minimum recovery foot clearance, 0.01 planted-foot error, root scale `1.25/1.25/1.25`, maximum bone-scale deviation 0 and console 0 errors/0 warnings.

The same deformation-safe presentation layer upgrades stage-0 TailSwipe from a small local tail gesture to a full-body local spin: approximately -25° anticipation, 180° tail-first contact, 360° follow-through and a mathematically identical zero-degree resting orientation. The selected-target parent still owns facing and the existing authority still owns its one contact, range, damage and 8-degree tolerance. Browser samples in both Quality 3D and MapLab 5 recorded the 180° contact and 360° completion while remaining grounded with no bone-scale deviation.

This root-only motion contract is also the inheritance baseline for Fang stages 1 and 2. Stage 1 now uses `Bite → Pounce → TailSwipe` and maps its logical Pounce to the safe Bite clip; stage 2 retains its anatomy-specific `Claw → Pounce → TailSwipe` and authored Pounce clip. Both use the same non-penetrating leap/landing correction and -25° / 180° / 360° tail-spin phases without sharing damage, duration, playback rate or model scale. Quality 3D and MapLab 5 samples confirmed one landing event, four dust puffs, grounded completion, uniform root scale, zero bone-scale deviation and one authoritative tail contact for each evolved form.
