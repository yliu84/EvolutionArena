# Shell stage-1 / 铁背守蜥 source record

Status: **Meshy job pack, awaiting user-supplied GLB.** Do not start Blender cleanup, retopology or rigging until the downloaded mesh passes the silhouette gates below.

- Prepared: 2026-08-17
- Identity: 岩盾一级 / 铁背守蜥 stage-1 (`ironback-warden` lineage, `shell` / `carapace` family)
- Provisional model name: `stone-pangolin` / 叠岩甲蜥 (Chinese display name is not locked for runtime strings)
- Source type: user-run Meshy Image to 3D from the accepted concept B (visible-legs)
- Contract: `../PRODUCTION-MODEL-CONTRACT-V1.md`
- Generation service: Meshy web application, generated and supplied by the user for this project
- Downstream runtime (not this step): `public/assets/quality-3d/models/stone-pangolin-rigged-v1.glb`

When Meshy finishes, drop the downloaded textured GLB into **this folder** (`docs/concepts/evolution-v2/shell-stage1/source/`). Keep the original Meshy filename, then record it, the SHA-256 and the selected license in the blank fields below. The source GLB is immutable. Derived cleanup/rig files must use separately named paths.

- Downloaded:
- Original Meshy filename:
- Stored source:
- SHA-256:
- License selected in Meshy:
- Required attribution: identify Meshy as the generation tool in public asset or game credits (same rule as coral-gecko / scarlet-gecko)

Exact commercial-license/account evidence must be retained by the project owner before public release. This record does not invent terms that were not supplied with the download.

## Upload order

These are already separate images. Do **not** collage them into one sheet. Scarlet-hunter already proved a multi-pose board in a single-image job merges several bodies into one mesh.

| Order | Role | File |
| --- | --- | --- |
| 1 | **Primary reconstruction image** (3/4 standing pose). Use this alone if Meshy is in single-image mode. | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/shell-stage1-concept-b-stone-pangolin-visible-legs.png` |
| 2 | Extra view — side silhouette, plate rows, tail length, legs clear of the skirt | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/shell-stage1-concept-b-stone-pangolin-side.png` |
| 3 | Extra view — front symmetry, limb spacing, head tucked under the rim | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/shell-stage1-concept-b-stone-pangolin-front.png` |

Do **not** upload:

- `shell-stage1-concept-b-stone-pangolin.png` (first draft; legs hidden under the plate skirt, superseded)
- Concept A plated gecko, C buckler-head, or D moss-toad
- Any combined turnaround / attack-pose board

## Meshy prompt (paste English)

Meshy Image to 3D usually wants English. Paste this with image 1. The image carries the silhouette; the prompt only locks identity and rejects the known failure modes.

```
Stylized low-poly toon game character. A low, wide pangolin covered in overlapping thick grey basalt stone plates — a shingled armored mound, about 30 to 45 large plates with visible thickness and a hard lifted lip on each overlap. Dark teal-green hide on four separate stout legs that stay fully visible below the plate skirt. Four planted three-clawed feet on the ground; legs must not fuse, merge, or hide under the skirt. Head tucked low and forward under the front plate rim, one amber eye, cream throat and belly. Thick tail fully plated to the tip and shorter than the torso. Matte stone and hide, zero metal. Neutral grey background, one complete standing creature, no extra views or text in the image.

Not a turtle, not a dome shell, not a fused-leg blob. Not a red raptor, scarlet gecko, coral-crested gecko, or monitor lizard. No spinal spike ridge, no long smooth tapering gecko tail, no raised neck on a stalk, no photoreal micro-scales.
```

Chinese copy (do not paste unless the UI is in Chinese; keep as the project translation):

```
风格化低面卡通游戏角色。一只低矮宽体的穿山甲，全身叠瓦厚玄武岩石甲——整背是一座叠甲丘，大约 30 到 45 块大甲片，每片有厚度和翘起的叠压唇。甲裙线以下必须露出四条分开的粗短腿，暗青绿皮肤，四足三爪踏地，腿不得融合、并腿或藏进甲裙。头低低探在前甲缘下，一只琥珀眼，喉与腹为奶油色。尾粗、甲片铺到尖、短于躯干。哑光石甲与皮肤，无金属。中性灰背景，画面里只有一只完整站姿生物，不要拼小图或文字。

不要做成乌龟、圆顶甲壳或并腿肉团。不要做成红色迅猛龙、赤冠壁蜥、珊瑚冠壁虎或高站姿巨蜥。不要脊背棘刺垄、不要又长又光滑的壁虎尾、不要高抬的长颈、不要写实微鳞。
```

## Must-keep constraints

- All four legs clear the plate skirt; feet and claws readable below the skirt line
- Four planted feet; quadruped, not a biped and not a sliding mound
- Legs separate: no fused pairs, no single skirt-blob with painted-on claws
- Overlapping stone plates are the identity (rows with thickness), not a smooth turtle dome
- Low tucked head, one amber eye, cream underbelly, dark teal-green hide
- Grey basalt plates, yellow-green lichen in seams; no coral-red / teal-jade Fang palette
- Stylized low-poly toon planes; Meshy High Detail is only to keep structure

## Reject immediately (do not download as a keeper)

| Failure | Why |
| --- | --- |
| Turtle shell / dome / fused-leg blob | Hides feet; fails locomotion and dust (standard rule 3). Same failure as the superseded hidden-legs draft. |
| Generic armoured monitor lizard: spinal spikes, long smooth tail, tall stance, raised neck | Text-to-3D attempt 1, 2026-08-17. Indistinguishable from stage 0/1 at the gameplay camera. |
| Red raptor / scarlet gecko / coral-crested gecko | Wrong species and wrong palette. Fang coral/teal/cream must not appear on Shell stage 1. |
| Legs present in texture but not as separate volumes | Cannot rig four tracked feet. |
| Photoreal scale noise as the primary surface | Scarlet-hunter: High Detail is source fidelity, not a license to ship microdetail. |

Record every further attempt in the contract rejected-candidates table with date, method and outcome. Attempt count is this branch's primary deliverable.

## Documented Meshy UI settings

Only settings already recorded on prior jobs. Do not invent topology / polycount / texture-style toggles that were never written down.

1. **Image to 3D**, not Text to 3D. Text-to-3D is forbidden for this form (`PRODUCTION-MODEL-CONTRACT-V1.md`).
2. **High Detail** (coral-gecko source: Meshy 5 legacy, High Detail, single-image; scarlet-hunter: High Detail keeps structure, runtime still retopologises).
3. **Single-image reconstruction** unless the UI has a dedicated extra-view slot. If it does, add side then front as views 2 and 3. Never paste three drawings into one image.
4. **Download the textured GLB** (coral-gecko original filename pattern `*_texture.glb`).
5. **Do not run Meshy Walking / Auto-rig yet.** Contract acceptance sequence: silhouette review against this pack before any rigging.

Coral-gecko selected **CC BY 4.0** in Meshy. Record whatever license this job actually uses; do not assume it.

## Next step after the GLB lands

1. Put the file in this folder and fill the downloaded / filename / SHA-256 / license fields.
2. Compare front, side and 3/4 against the contract: plates, visible legs, four planted feet, no turtle blob, no red raptor.
3. If it fails, keep the file as a numbered rejected candidate and run another Image to 3D job. Do not "fix it in Blender" to invent a different animal.
4. If it passes, stop. Blender cleanup, retopology, form-specific rig and the `Bite → Slam → TailSwipe` clips are a later task. Do not overwrite coral-gecko, scarlet-gecko or scarlet-hunter runtime files.
