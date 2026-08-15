# Coral-crested gecko processing record

Status: playable web-game LOD and dedicated quadruped rig integrated into the Quality 3D trial.

## Outputs

- `coral-gecko-clean-high-v1.glb`: cleaned high-detail source, 320,506 triangles, original 2K PBR textures.
- `coral-gecko-meshy5-lod0-v1.glb`: web candidate, 54,997 triangles, 1K base-color/ORM/normal textures, approximately 6.7 MB.
- `runtime-preview-v1/`: neutral-light front, side, rear and gameplay-camera previews.
- `../../../public/assets/quality-3d/models/coral-gecko-lowpoly-v1.glb`: playable 32,000-triangle LOD with three 1K PBR textures (approximately 6 MB).
- `../../../public/assets/quality-3d/models/coral-gecko-rigged-v2.glb`: 20-bone skinned quadruped with `Idle`, `Run` and `Turn` animation clips.

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
- Jaw separation and bite animation remain a later combat-animation task; they are intentionally outside this locomotion pass.
