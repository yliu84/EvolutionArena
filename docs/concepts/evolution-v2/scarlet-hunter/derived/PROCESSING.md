# Scarlet hunter processing record

Status: official Meshy quadruped template candidate integrated; awaiting user visual acceptance.

## Rejection that caused the redesign

The first stage-2 study, `scarlet-hunter-rigged-v1.glb`, is retained only as history. It was rejected in player-view review for three coupled failures: its inherited lengthening and narrowing made the body read as a flat sheet beside stage 1, its dark-crimson multiplication collapsed toward black in forest lighting, and its `Bite → Claw → TailSwipe` rhythm was functionally the same as the first evolution. It is no longer loaded by either runtime entry.

## V2 output contract

- Runtime form: `scarlet-hunter` / 赤爪猎龙
- Runtime GLB: `public/assets/quality-3d/models/scarlet-hunter-rigged-v2.glb`
- Candidate baseline: `scarlet-hunter-second-evolution-candidate-v2`
- Candidate combat profile: `scarlet-hunter-combat-candidate-v2`
- Geometry: one coherent skinned mesh, 32,000 triangles
- Rig: 21 bones, including jaw, four tracked feet and four tail joints
- Required clips: `Idle`, `Run`, `Turn`, `Bite`, `Claw`, `TailSwipe`, `Hit`, `Death`
- Dimensions reported by Blender: 1.133537 × 2.420185 × 1.208551
- Display scale: 1.77, exactly 18% above the accepted stage-1 scale of 1.50
- Body-plan read: broad-chested, heavy-pelvis, compact hunter drake with a thick load-bearing tail root
- Material read: burnished crimson and copper-red scale layers, pale underside breakup, preserved normal/roughness detail and no crushed-black base
- Added rigid attachments: none

## Reproducible processing

The audited Blender pipeline imports the immutable stage-1 GLB into a new scene and changes only the stage-2 derivative. V2 broadens the load-bearing chest, deepens the pelvis, thickens the tail root, shortens the apparent torso budget and reduces the crown-to-body ratio. The stage-1 vertex groups are not trusted after that anatomical change: weights for all 21 bones are recalculated against the new mesh so shoulder, hip, jaw and tail motion follow the new volume instead of stretching it into plates.

The texture transform uses a warm charcoal floor plus burnished crimson and copper-red mid/high layers. It preserves the eyes, pale underside and crown breakup, normal map and roughness response. A small stage-2-only presentation lift keeps the material readable in forest shadow without making it emissive-looking.

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/blender/create_scarlet_gecko.py -- \
  public/assets/quality-3d/models/scarlet-gecko-rigged-v1.glb \
  public/assets/quality-3d/models/scarlet-hunter-rigged-v2.glb \
  scarlet-hunter

node scripts/fix-zero-gltf-tangents.mjs \
  public/assets/quality-3d/models/scarlet-hunter-rigged-v2.glb \
  /private/tmp/scarlet-hunter-rigged-v2-fixed.glb

npm run validate:gltf -- \
  public/assets/quality-3d/models/scarlet-hunter-rigged-v2.glb
```

The targeted tangent repair corrected two zero-length tangent vectors. Final glTF validation reports 0 errors, 0 warnings, 0 infos and 0 hints. The final SHA-256 is `10b0bed009542e3b98fc004faf9a1d34b9e387e59c8e402f83ff83d07607bc19`.

## Stage-2 attack identity

The input boundary is still one normal-attack button and the skill system remains disabled. Stage 2 now owns a different ordinary-attack cadence:

1. `Claw` / 扑爪 — a fast forward body commitment and foreclaw contact.
2. `Bite` / 重咬 — a slower head-and-neck compression with heavier damage.
3. `TailSwipe` / 尾砸 — a longer diagonal tail lift and crush-slam finish.

The stage-2 profile supplies independent duration, contact time, playback rate, damage, range, knockback, particles and camera trauma. Each step still reacquires the selected target, turns before contact and refuses a hit when residual aim error exceeds 8 degrees. This remains a normal-attack system, not the future skill-attack system.

## Runtime integration and evidence

- Quality 3D stage 2 reports `formId=scarlet-hunter`, `bodyPlan=broad-chested-hunter-drake`, display scale 1.77, four tracked feet and `nextAction=Claw`.
- The formal Phaser hunt swaps its transparent Three.js presentation overlay to v2 while Phaser retains movement, collision, selected target, health, hit and death authority.
- The model viewer completed the new `Claw → Bite → TailSwipe` chain against one locked training target at 0 degrees aim error; `skillsEnabled=false` remained unchanged.
- `runtime-preview-v2/` contains neutral-light front, side, rear and gameplay-angle silhouette evidence.
- `attack-preview-v2/` contains the three contact-pose renders used to reject collapsed joints, stretched plates and broken tail arcs before runtime review.
- Automated totals and browser viewport/console evidence are recorded in the development log after the final full pass.

Physical midrange-mobile performance and user aesthetic approval remain release gates and are not claimed by this candidate.

## V3 jaw and runtime-presentation refinement

The accepted runtime file is `public/assets/quality-3d/models/scarlet-hunter-rigged-v3.glb`, SHA-256 `0d5fdda39b0be7dea831a4c51156a2919b4aaac797740e377e547c4d4bf8c124`. V3 preserves the V2 mesh, broad-chested body plan, 32,000-triangle budget, 21 bones, materials and eight named clips. It refines the independent `Jaw` motion so `Bite` has a readable gape, snap and tear instead of relying only on a head lunge. After user acceptance, the identifiers were promoted to `scarlet-hunter-second-evolution-master-v1` and `scarlet-hunter-combat-master-v1` without regenerating or modifying the GLB.

Neutral-light turntable renders confirm that the asset itself retains chest depth, four load-bearing limbs, a thick tail root and non-black crimson/copper surface breakup. Runtime presentation now uses a lower perspective camera and a soft player-following fill light so those volumes remain visible in the forest. Contact presentation adds action-specific pooled arcs and brief hit stop, but neither the jaw animation nor those effects own damage. Target selection, the 8-degree contact rule and one damage event remain authoritative outside the presentation layer.

## Production-v4 official quadruped template candidate

The user rejected the native-toon studies and the custom jaw experiments as production solutions. The accepted source direction is now the official Meshy quadruped rig and skin from `source/scarlet-hunter-meshy-rigged-walking-v4.glb`; the earlier native-toon, retopology and custom-jaw files remain historical studies and are not loaded by either runtime.

- Runtime GLB: `public/assets/quality-3d/models/scarlet-hunter-quadruped-v1.glb`
- Reproducible candidate: `derived/production-v4/scarlet-hunter-quadruped-template-candidate-v15.glb`
- Runtime baseline: `scarlet-hunter-quadruped-template-v1`
- Reusable template: `meshy-quadruped-combat-v1`
- Geometry: 54,828 triangles, one skinned mesh and one 2K texture set
- Rig: 27 official Meshy quadruped bones; no custom jaw bone and no synthetic mouth cavity
- Clips: `Idle`, `Walk`, `Run`, `Turn`, `Claw`, `Pounce`, `TailSwipe`, `Hit`, `Death`
- Runtime display scale: 196 for the centimeter-authored source; the authored stage-growth contract remains 18% above stage 1
- Orientation: model-local +Z is corrected once with `modelYaw = π/2`; movement still turns the character root toward world travel before translation
- SHA-256: `9efd2d2d78fec9122c43668963f90223b55a8a6f8a06f2ded8811fe872a42b51`

The original Meshy Walking file was not a usable locomotion clip: both `Walk` and copied `Run` had static limb curves and only moved `Hips.location.z`, which produced visible sliding. Candidate v15 replaces those clips with authored diagonal quadruped cycles. Left-front/right-rear and right-front/left-rear now alternate, with restrained shoulder, lower-leg, chest, head and tail counter-motion. Runtime Run weight is 1.0 with no Idle support blend, while the existing turn-before-translate gate and additive-leg-rotation ban remain intact.

The normal-attack chain is `Claw → Pounce → TailSwipe` (`裂爪 → 双爪前扑 → 尾砸`). A world-axis shoulder sweep identified safe mirrored rotations before authoring v15. `Claw` raises one forepaw during anticipation and drives it down through contact. Runtime review later exposed that v15's `Pounce` shoulder curve kept increasing the backward sweep through contact, so both paws disappeared below the chest and read as retraction. Candidate v16 corrects the bone action itself: anticipation unfolds both forearms visibly ahead of the chest, then the contact key reverses the shoulder sweep and drives both extended paws forward/down. The root-only visual lunge remains non-authoritative and no runtime Euler rotation is added to weighted legs. Both contacts draw exactly two near-parallel vertical claw marks on the live target/contact point. TailSwipe uses a larger planted hip and tail arc. The effects retain brief hit stop and camera trauma, while one authoritative damage event still occurs at the existing contact time. The model does not open the mouth and does not pretend to be a Bite.

The reusable runtime rig mapping names `chest` and `head`, tracks `frontleg2`, `R_frontleg2`, `backleg2` and `R_backleg2` as the four ground contacts, and exposes `tail1`–`tail3` for safe secondary inertia. No additional runtime Euler rotation is applied to weighted legs. Browser verification reports four tracked feet, planted-foot error 0.00–0.04, `grounded=true`, full-weight `Run`, correct `Turn → Run` gating and no console errors or warnings. Offline five-frame sheets for v14/v15 retain the intermediate poses as evidence; v15 has no stretched, folded or collapsed paws.

The runtime keeps one normal-attack button, reacquires the same live locked target for every step, turns at the accepted rate and rejects contact above 8 degrees. Skills remain disabled. This file remains a candidate until the user accepts the model and action aesthetics; automated correctness does not promote it to master.
