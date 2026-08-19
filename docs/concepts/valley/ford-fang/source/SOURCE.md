# Valley Fang prey / 浅滩裂牙 source record

Status: **Meshy job pack, awaiting user-supplied GLB.** Do not start Blender cleanup, retopology or rigging until the downloaded mesh passes the silhouette gates below.

- Prepared: 2026-08-18
- Identity: 河谷裂牙猎物 / 浅滩裂牙 (`ford-fang`)
- Source type: user-run Meshy Image to 3D from the accepted 3/4 concept, with matching left and right profiles
- Contract: `../PRODUCTION-MODEL-CONTRACT-V1.md`
- Generation service: Meshy web application, generated and supplied by the user for this project
- Downstream runtime (not this step): `public/assets/quality-3d/models/ford-fang-rigged-v1.glb`

When Meshy finishes, drop the downloaded textured GLB into **this folder** (`docs/concepts/valley/ford-fang/source/`). Keep the original Meshy filename, then record it, the SHA-256 and the selected license in the blank fields below. The source GLB is immutable. Derived cleanup/rig files must use separately named paths.

- Downloaded:
- Original Meshy filename:
- Stored source:
- SHA-256:
- License selected in Meshy:
- Required attribution: identify Meshy as the generation tool in public asset or game credits (same rule as coral-gecko / scarlet-gecko / stone-pangolin)

Exact commercial-license/account evidence must be retained by the project owner before public release. This record does not invent terms that were not supplied with the download.

## Upload order

These are already separate images. Do **not** collage them into one sheet. Scarlet-hunter already proved a multi-pose board in a single-image job merges several bodies into one mesh.

| Order | Role | File |
| --- | --- | --- |
| 1 | **Primary reconstruction image** (3/4 standing pose). Use this alone if Meshy is in single-image mode. | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-ford-fang-meshy-source-three-quarter.png` |
| 2 | Extra view — right profile, length vs height, snout, dorsal scutes, tail | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-ford-fang-meshy-source-side-right.png` |
| 3 | Extra view — left profile, exact horizontal mirror of view 2 | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-ford-fang-meshy-source-side-left.png` |

The left profile is a horizontal flip of the right profile so length, scute count and stripe placement cannot drift. If the UI has only one extra-view slot, use the **right** profile.

Do **not** upload:

- `valley-cliff-maw-concept.png`, `valley-source-root-concept.png`, `valley-brow-shield-concept.png`, `valley-drowned-host-concept.png`
- `valley-ford-fang-concept.png` as a second primary (it is the same pose as the three-quarter source; use the `meshy-source-three-quarter` filename)
- Any combined turnaround / attack-pose board

## Meshy prompt (paste English)

Meshy Image to 3D usually wants English. Paste this with image 1. The image carries the silhouette; the prompt only locks identity and rejects the known failure modes.

```
Stylized low-poly toon game character. A four-legged river hunter: long narrow pike/gharial snout with interlocking conical teeth, thick muscular neck, compact torso, four planted three-clawed feet, thick tapering tail. Hind legs slightly more powerful than the forelimbs. A row of sharp triangular dorsal scutes from the nape to the tail base. Wet olive-green hide, cream segmented throat and belly, teal bands across the back and tail, amber eye, amber claws. Matte wet skin, zero metal. Neutral grey background, one complete standing creature, no extra views or text in the image.

Not a gecko, not a coral-crested lizard, not a red raptor, not a pangolin, not a crab, not a turtle. No wings, no extra legs, no rider, no floating parts.
```

Chinese copy (do not paste unless the UI is in Chinese; keep as the project translation):

```
风格化低面卡通游戏角色。一只四足河猎：细长鳄吻、交错锥齿、颈粗、躯干紧凑、四足三爪踏地、尾粗而收尖。后腿略强于前腿。从颈后到尾根一排三角形背棘。湿橄榄绿皮肤，奶油色分节喉腹，背与尾有青色横带，琥珀眼、琥珀爪。哑光湿皮，无金属。中性灰背景，画面里只有一只完整站姿生物，不要拼小图或文字。

不要壁虎、珊瑚冠蜥、红色迅猛龙、穿山甲、螃蟹或乌龟。不要翅膀、多余的腿、骑手或漂浮零件。
```

## Must-keep constraints

- Quadruped, four planted feet, four separate legs
- Long narrow biting snout is the identity; the bite must read from the gameplay camera
- Dorsal scute row from nape to tail base; tail thick then tapering, not a whip and not a plated club
- Olive-green + cream belly + teal bands; no Fang coral-red crown, no Shell stone plates, no Swarm cyan sac
- One connected creature
- Stylized low-poly toon planes; Meshy High Detail is only to keep structure

## Reject immediately (do not download as a keeper)

| Failure | Why |
| --- | --- |
| Coral-crested gecko / scarlet gecko / red raptor | Wrong species. That is the player Fang body. |
| Turtle, pangolin, crab, pincers | Wrong family. That is Shell or 溯流刀甲. |
| Cyan flank sac or glowing orbs | Wrong family. That is Swarm. |
| Biped / raptor on two legs | Cannot reuse the verified 27-bone quadruped gait. |
| Snout present in texture but not as a volume | The bite is the attack silhouette; a painted-on jaw cannot sell it. |
| Photoreal scale noise as the primary surface | High Detail is source fidelity, not a license to ship microdetail. |

Record every further attempt in the contract generation-attempts table with date, method and outcome.

## Documented Meshy UI settings

Only settings already recorded on prior jobs. Do not invent topology / polycount / texture-style toggles that were never written down.

1. **Image to 3D**, not Text to 3D. Text-to-3D is forbidden for this form (`PRODUCTION-MODEL-CONTRACT-V1.md`).
2. **High Detail**.
3. **Single-image reconstruction** unless the UI has a dedicated extra-view slot. If it does, add right profile then left profile. Never paste three drawings into one image.
4. **Download the textured GLB**.
5. **Do not run Meshy Walking / Auto-rig yet.** Silhouette review against this pack before any rigging.

Record whatever license this job actually uses; do not assume it.

## Next step after the GLB lands

1. Put the file in this folder and fill the downloaded / filename / SHA-256 / license fields.
2. Compare front, both sides and 3/4 against the contract: long snout, four legs, scute row, olive/cream/teal, not a gecko, not a pangolin.
3. If it fails, keep the file as a numbered rejected candidate and run another Image to 3D job. Do not "fix it in Blender" to invent a different animal.
4. If it passes, stop. Blender cleanup, retopology, form-specific rig and clips are a later task. Do not overwrite coral-gecko, scarlet-gecko, stone-pangolin, scarlet-hunter, brood-stalker or tide-cleaver runtime files.
