# Scarlet gecko processing record

Status: V1 preserved as a previously accepted historical master; V2 replacement candidate integrated and awaiting user visual acceptance.

## Current V2 candidate contract

- Runtime form: `scarlet-gecko` / 赤冠壁蜥
- Runtime GLB: `public/assets/quality-3d/models/scarlet-gecko-rigged-v2.glb`
- Accepted baseline: `scarlet-gecko-first-evolution-master-v2`
- Combat profile: `scarlet-gecko-combat-master-v1` (authority unchanged)
- Geometry: 19,406 character triangles; the exporter also retains one invisible 80-triangle Blender custom-bone helper that runtime loaders explicitly hide
- Rig: 27 bones with four independent limb chains, head/chest control and three tracked tail joints
- Required clips: `Idle`, `Walk`, `Run`, `Turn`, `Bite`, `Claw`, `TailSwipe`, `Hit`, `Death`
- Display scale: 1.661, approximately 20% above stage 0 and 18% below stage 2
- Body-plan read: volumetric load-bearing quadruped with a full chest, compact pelvis, continuous tail and integrated crown
- Material read: coral-red scales with teal-jade breakup and cream accents; semi-matte, zero-metal response preserves texture detail in forest light

The V2 processing script imports the user-supplied Meshy walking rig, removes imported scale animation, preserves the real quadruped gait, creates the remaining named movement/combat/reaction clips with quaternion rotations, and exports an independent runtime file:

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/blender/augment_scarlet_gecko_meshy_rig.py -- \
  public/assets/quality-3d/models/scarlet-gecko-meshy-walking-source-v2.glb \
  public/assets/quality-3d/models/scarlet-gecko-rigged-v2.glb
```

Offline validation reports 0 errors and 0 warnings. All nine sampled actions keep bone scales at unit scale. Run-quarter frames show independent planted and swinging limbs rather than root-only sliding; sampled Bite and TailSwipe poses preserve chest, feet and tail volume without the V1 flat-body read or the stage-0 foreleg stretch defect.

Quality 3D and MapLab 5 load the new model through the stage-1 asset mapping. Runtime explicitly hides the Blender custom-shape helper. The accepted shared stage-0/1 normal-attack language remains `Bite → Pounce → TailSwipe`: Pounce reuses the safe Bite clip plus the grounded leap envelope, and TailSwipe uses the shared 360-degree visual-root spin. Damage, selected-target authority, range, 8-degree contact tolerance and disabled skills are unchanged. Promotion to a new master requires the user's visual and gameplay acceptance.

Browser verification completed the full chain against the Quality 3D training target: health changed 84→68→50→36 for `Bite → Pounce → TailSwipe`; Pounce produced one landing event and four pooled dust sprites, TailSwipe registered once, aim error remained 0, root scale stayed uniform at 166.1 and maximum bone-scale deviation stayed 0. MapLab 5 loaded the same candidate, produced a real Pounce hit against a shield prey and retained positive shrine/terrain collision clearance. The current 429×791 CSS-pixel narrow application panel remained usable with zero horizontal overflow, and both tabs recorded no console errors or warnings. The previously validated 844×390 landscape control layout was not modified by this asset-only replacement, but a fresh physical-device performance pass remains a release gate.

## Gait, material, direction and spacing revision (2026-08-16)

The first gameplay review of V2 exposed four defects that the static asset pass did not catch: the authored feet cycled too slowly for 6.2 world-units/second, limb travel was too small, the forest-lit material appeared pale and flat, and keyboard/touch axes were interpreted in world space instead of the camera's screen plane. Attack approach also allowed living bodies to occupy the same space.

- The Blender processing step now amplifies quaternion motion relative to each limb bone's frame-0 orientation by 1.22, limited to a safe 58-degree delta. It amplified 1,984 rotation keys across 16 limb bones without adding scale animation. The new runtime SHA-256 is `100c5e3d222650951828ea0aef3d308d9d91e1ac54c2aaa43c681877ad69b314`.
- Stage-1 Run playback is 1.45, with 5.8 presentation foot-contact events per second. Offline Run frames 0/6/12/18/24 show a larger alternating four-limb stride; all nine actions retain unit bone scale. glTF Validator reports 0 errors and 0 warnings.
- Direct W testing later exposed an internal Run-clip sway that parent-facing tests could not see: relative yaw reached approximately 11.5° on Hips, 11.2° on chest and 15.6° on head, so individual gait phases could make the complete spine look diagonally aimed while the authoritative parent had zero facing error. Runtime now clones only stage-1 Run/Walk and retains full pitch/limb motion while scaling core yaw to 0.22 and roll to 0.18. The source GLB and all attack clips remain immutable.
- A second intermittent trigger came from animation-state cleanup: one-shot attacks use `clampWhenFinished`, but the former Idle transition stopped only Run. A completed Bite/Pounce/TailSwipe could therefore keep its last-frame chest/head rotation mixed under later locomotion. Entering Idle or Run now explicitly stops every other action before starting the locomotion clip; attack-to-attack transitions retain their intended short crossfade.
- The stage-1 material applies a warm deepening tint, 0.46–0.64 roughness range, zero metalness and 0.50 environment-map intensity in every runtime loader. The Meshy source reused its base-color image as a full-strength emissive texture; that flattened all forest-light response into a pale watercolor read. Runtime now limits that texture to 0.18 emissive fill, then applies a restrained 1.16 contrast / 1.24 saturation surface grade. The result keeps coral/teal/cream readable in shadow while restoring real key-light, body-plane and specular response.
- Keyboard and touch movement are now camera-relative: screen up/down and left/right map to two orthogonal horizontal camera bases. A follow-up projection check corrected the right basis from the accidentally mirrored `camera-up × camera-forward` sign to `camera-forward × world-up`, so A/D now travel toward their actual screen sides. The existing 6-degree turn-before-translation rule remains authoritative, so cardinal input cannot produce diagonal visual sliding.
- Player and living prey now reserve typed body radii during chase, manual travel and attack approach. Chase travel clamps at the remaining clearance; repeated pairwise separation prevents multiple prey from stacking. Stage-1 Pounce visual travel is presentation-only and reduced to 0.32 so the strike reaches the target edge without embedding the complete body; its vertical lift is independently multiplied by 1.65, producing an approximately 0.49-unit airborne peak that remains clearly readable at the gameplay camera.

Final browser sampling showed Run at 6.2 world-units/second with the new clip rate, zero facing error after turning, deeper material separation and `entityMinimumClearance = 0` while two enemies surrounded the player. Sustained direct W input now keeps the head/chest/hips spine aligned with screen-up across the stabilized Run cycle. The combat/death/reset/W chain reported only `{ Run: 0.31 }` during the sampled fade-in, attack-local yaw 0 and facing error 0; no clamped one-shot remained active. A fresh Pounce series recorded `crouch → launch → land → recover`, lift `0 → 0.49 → 0`, horizontal offset no greater than 0.25 and facing error 0. Bite and Pounce changed the target from 46→30 with no body-center overlap. Automated validation passed 60 test files / 320 tests, TypeScript, `git diff --check` and the Vite production build; browser console errors/warnings remained zero. The pre-existing >500 kB chunk advisory remains.

## Historical V1 contract

- Runtime form: `scarlet-gecko` / 赤冠壁蜥
- Runtime GLB: `public/assets/quality-3d/models/scarlet-gecko-rigged-v1.glb`
- Accepted baseline: `scarlet-gecko-first-evolution-master-v1`
- Accepted combat profile: `scarlet-gecko-combat-master-v1`
- Geometry: 32,000 triangles
- Rig: 21 bones, including jaw, four tracked feet and four tail joints
- Required clips: `Idle`, `Run`, `Turn`, `Bite`, `Claw`, `TailSwipe`, `Hit`, `Death`
- Dimensions reported by Blender: 0.748782 × 2.552865 × 1.069226
- Display scale: 1.50, exactly 20% above the stage-0 display scale of 1.25
- Body-plan read: longer, narrower, taller and more mature crested-gecko
- Added rigid attachments: none; the silhouette remains one integrated skinned mesh

## Reproducible processing

The Blender script imports the accepted V3 web master into a new file, removes only the helper mesh, leaves the source file untouched, and reshapes the skinned vertex positions. The torso is narrowed, the head and tail are lengthened, and the upper body is raised while the foot plane remains at `Z = 0`.

The source blue-green scale pixels are copied and selectively recolored in Blender to deep scarlet. Amber eyes, pale horn/crest areas, dark creases, baked surface detail, the existing normal map and roughness data remain visible. This replaced an earlier rejected experiment with low-poly armor/spine attachments; those pieces are not present in the accepted master.

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/blender/create_scarlet_gecko.py -- \
  public/assets/quality-3d/models/coral-gecko-rigged-v3.glb \
  public/assets/quality-3d/models/scarlet-gecko-rigged-v1.glb

node scripts/fix-zero-gltf-tangents.mjs \
  public/assets/quality-3d/models/scarlet-gecko-rigged-v1.glb \
  /private/tmp/scarlet-gecko-rigged-v1-fixed.glb
```

The targeted tangent repair corrected two inherited zero-length tangent vectors. Final glTF validation reports 0 errors, 0 warnings, 0 infos and 0 hints.

## Runtime integration and evidence

- Quality 3D stage 1 loads the independent GLB URL and exposes the accepted master baseline/profile, `crested-gecko` body plan and disabled skill state.
- Natural formal evolution swaps the transparent Three.js presentation overlay from stage 0 to stage 1 while Phaser continues to own movement, collision, selected target, range, damage, health, knockback and death.
- Browser traces observed `Bite → Claw → TailSwipe` with training-target hits, then `Turn`, `Run`, `Hit`, `Death` and reset. Grounding stayed true with sampled planted-foot error 0.01–0.04.
- The formal hunt loaded stage 1 with `ready=true`, `formId=scarlet-gecko`, the master IDs and `skillsEnabled=false`. Its QA lock and attack controls call the same selected-target basic-attack path.
- Desktop 1440×900 and simulated mobile landscape 844×390 passed for the evolution viewer and formal hunt. Browser logs contained only Vite connection messages and the Phaser startup banner; no errors or warnings were recorded.
- Automated validation: 48 test files / 250 tests passed; production build passed with the existing large-chunk advisory; accepted V3 and scarlet-gecko GLBs both validate at 0 errors / 0 warnings.

`runtime-preview-v1/` contains neutral-light front, side, rear and gameplay-angle evidence. The user accepted this first evolution and its exact 20% display increase on 2026-08-15. Physical midrange-mobile performance remains a public-release gate.
