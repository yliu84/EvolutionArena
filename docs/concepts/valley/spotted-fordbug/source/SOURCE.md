# Valley spotted beetle / 彩石瓢甲 source record

Status: **Meshy job pack, awaiting user-supplied GLB.** Do not start Blender cleanup, retopology or rigging until the downloaded mesh passes the silhouette gates below.

- Prepared: 2026-08-18
- Identity: 河谷温和猎物 / 彩石瓢甲 (`spotted-fordbug`)
- Source type: user-run Meshy Image to 3D from the accepted 3/4 concept, with matching left and right profiles
- Contract: `../PRODUCTION-MODEL-CONTRACT-V1.md`
- Generation service: Meshy web application, generated and supplied by the user for this project
- Downstream runtime (not this step): `public/assets/quality-3d/models/spotted-fordbug-rigged-v1.glb`

When Meshy finishes, drop the downloaded textured GLB into **this folder** (`docs/concepts/valley/spotted-fordbug/source/`). Keep the original Meshy filename, then record it, the SHA-256 and the selected license in the blank fields below. The source GLB is immutable. Derived cleanup/rig files must use separately named paths.

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
| 1 | **Primary reconstruction image** (3/4 standing pose). Use this alone if Meshy is in single-image mode. | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-spotted-fordbug-meshy-source-three-quarter.png` |
| 2 | Extra view — right profile, dome height vs length, four legs, antennae | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-spotted-fordbug-meshy-source-side-right.png` |
| 3 | Extra view — left profile, exact horizontal mirror of view 2 | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-spotted-fordbug-meshy-source-side-left.png` |

The left profile is a horizontal flip of the right profile so dome height, spot placement and leg count cannot drift. If the UI has only one extra-view slot, use the **right** profile.

Do **not** upload:

- `valley-reed-otterling-concept.png`, `valley-pebble-dumpling-concept.png`, `valley-driftwood-mimic-concept.png`, `valley-terrace-grazer-concept.png`
- `valley-spotted-fordbug-concept.png` as a second primary (same pose as the three-quarter source)
- Any combined turnaround / attack-pose board

## Meshy prompt (paste English)

Meshy Image to 3D usually wants English. Paste this with image 1. The image carries the silhouette; the prompt only locks identity and rejects the known failure modes.

```
Stylized low-poly toon game character. A cute four-legged river beetle: high round ladybug dome shell, warm reddish-orange with large cream spots and a center seam. Small dark grey head under the front rim, two large round amber eyes, two short thick orange antennae with bulbous tips. Four stout segmented brown legs with three cream claws, fully visible. Cream tan underside. Short stubby rear, no long tail. Slightly cute, no teeth, no snarl. Matte painted shell, zero metal. Neutral grey background, one complete standing creature, no extra views or text in the image.

EXACTLY FOUR LEGS. Not six insect legs, not a crab, not a pangolin, not a gecko, not a turtle stack of shingles. No open wings, no pincers, no rider, no floating parts.
```

Chinese copy (do not paste unless the UI is in Chinese; keep as the project translation):

```
风格化低面卡通游戏角色。一只可爱的四足河甲虫：高圆瓢虫壳，暖橙红底加大奶油斑、中央有缝。深灰小头探在前缘下，两只大圆琥珀眼，两根短而粗的橙色触角带圆头。四条粗短分节褐腿，三趾奶油爪，完全可见。腹为奶油棕。尾极短，没有长尾。略可爱，不露齿、不咆哮。哑光手绘壳，无金属。中性灰背景，画面里只有一只完整站姿生物，不要拼小图或文字。

恰好四条腿。不要六足昆虫、螃蟹、穿山甲、壁虎或叠瓦龟。不要张开的鞘翅、钳子、骑手或漂浮零件。
```

## Must-keep constraints

- Exactly four planted legs; no extra insect legs
- High round spotted dome is the identity; spots are large cream circles, not micro-detail
- Antennae are short thick volumes with bulbous tips, not paper wires
- Large cute eyes; no teeth row, no pincers
- Orange shell + cream spots + dark grey head + brown legs
- One connected creature; elytra stay closed and fused
- Stylized low-poly toon planes; Meshy High Detail is only to keep structure

## Reject immediately (do not download as a keeper)

| Failure | Why |
| --- | --- |
| Six (or eight) insect legs | Breaks the four-limb lock. Cannot reuse the verified 27-bone quadruped rig. |
| Open / lifted wing cases | Meshy will detach them; runtime has no flying clip for this prey. |
| Pincers or crab arms | Wrong body. That is 溯流刀甲. |
| Overlapping pangolin shingles or a flat visor crab | Wrong Shell reads. Player 叠岩甲蜥 and 溯流刀甲 already own those. |
| Long gecko / raptor body | Wrong family. That is Fang. |
| Paper-thin antennae | Fragile Meshy topology. |
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
2. Compare front, both sides and 3/4 against the contract: four legs, high spotted dome, thick antennae, cute head, closed shell, not a crab, not a pangolin, not a six-leg beetle.
3. If it fails, keep the file as a numbered rejected candidate and run another Image to 3D job. Do not "fix it in Blender" to invent a different animal.
4. If it passes, stop. Blender cleanup, retopology, form-specific rig and clips are a later task. Do not overwrite coral-gecko, scarlet-gecko, stone-pangolin, scarlet-hunter, brood-stalker, tide-cleaver or ford-fang runtime files.
