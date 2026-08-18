# Valley gate-1 / 溯流刀甲 source record

Status: **Meshy job pack, awaiting user-supplied GLB.** Do not start Blender cleanup, retopology or rigging until the downloaded mesh passes the silhouette gates below.

- Prepared: 2026-08-18
- Identity: 河谷隘口一首领 / 溯流刀甲 (`tide-cleaver`, first modelled regional boss)
- Source type: user-run Meshy Image to 3D from accepted concept C (rim visor), with pincer blades thickened ~50%
- Contract: `../PRODUCTION-MODEL-CONTRACT-V1.md`
- Map spec: `docs/design/maps/VALLEY-MAP-SPEC-V1.md`
- Generation service: Meshy web application, generated and supplied by the user for this project
- Downstream runtime (not this step): `public/assets/quality-3d/models/tide-cleaver-rigged-v1.glb`

When Meshy finishes, drop the downloaded textured GLB into **this folder** (`docs/concepts/valley/tide-cleaver/source/`). Keep the original Meshy filename, then record it, the SHA-256 and the selected license in the blank fields below. The source GLB is immutable. Derived cleanup/rig files must use separately named paths.

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
| 1 | **Primary reconstruction image** (3/4 standing pose, thickened paddles). Use this alone if Meshy is in single-image mode. | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/tide-cleaver-meshy-source-three-quarter.png` |
| 2 | Extra view — strict side silhouette, length vs height, visor overhang, tucked tail plate | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/tide-cleaver-meshy-source-side.png` |
| 3 | Extra view — front symmetry, pincer span, limb spacing | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/tide-cleaver-meshy-source-front.png` |

Do **not** upload:

- `river-crustacean-boss-concept-a-shield-span.png` (concept A: smoother dome, reads as scaled Shell)
- `river-crustacean-boss-concept-b-river-boulder.png` (concept B: river-boulder mound, same Shell-family risk)
- `river-crustacean-boss-concept-c-rim-visor.png` as the **primary** Meshy image (identity lock, but the pincer blades are still the thin sheets that Meshy turns into fragile topology). Human review only.
- Any combined turnaround / attack-pose board

## Meshy prompt (paste English)

Meshy Image to 3D usually wants English. Paste this with image 1. The image carries the silhouette; the prompt only locks identity and rejects the known failure modes.

```
Stylized low-poly toon game character. A single armoured river crustacean, wide and low like a shield on legs. Broad flattened wedge carapace, wider than it is long, made of layered angular slate plates — not a smooth turtle dome and not overlapping pangolin shingles. Heavy overhanging V-shaped front visor rim of waterworn pale bone. Small deep-set eyes hidden under the rim. Short thick tail plate tucked beneath the rear.

EXACTLY FOUR LIMBS. Two thick front arms ending in large flattened paddle-pincers held low and wide; the pincer span is clearly wider than the body. The paddle blades are thick sturdy stone, not paper-thin sheets. Two short sturdy rear walking legs with three bone-coloured claws. No extra legs, no side legs, no crawling appendages, no eight-legged crab.

Wet river-stone colour: dark slate grey-green shell with paler mineral streaking, pale bone band on the visor rim and pincer edges. Matte stone, zero metal. Neutral grey background, one complete standing creature, no extra views or text in the image.

Not a turtle, not a pangolin, not a gecko, not a crab with eight legs. No floating parts, no detached plates, no barnacles standing off the shell, no rider, no weapon.
```

Chinese copy (do not paste unless the UI is in Chinese; keep as the project translation):

```
风格化低面卡通游戏角色。一只装甲河甲壳生物，宽而低，像架在腿上的盾。甲壳宽扁、宽大于长，棱面分层石板——不是光滑龟壳，也不是穿山甲叠瓦。前方沉重的 V 形骨色帽檐压住面部。眼睛小而深陷在檐下。短而厚的尾甲收在身后下方。

恰好四条肢体。前两肢是粗臂，末端是宽扁桨形钳，低开向两侧，钳展明显宽于身体。钳片是厚实石桨，不是纸片。后两肢是短而结实的步行腿，三趾骨色爪。不要多余的腿、侧腿、爬行附肢或八足蟹。

湿河石配色：暗青灰绿甲壳带浅色矿物纹，帽檐与钳缘是水磨骨色。哑光石质，无金属。中性灰背景，画面里只有一只完整站姿生物，不要拼小图或文字。

不要乌龟、穿山甲、壁虎、八足蟹。不要漂浮零件、脱落甲片、离开壳体的藤壶、骑手或武器。
```

## Must-keep constraints

- Exactly four limbs: two pincer-arms + two walking legs
- Pincer span clearly wider than the carapace; blades thick enough to reconstruct as volume
- Low flattened wedge carapace with a V visor rim; layered angular plates
- Short tail plate tucked under; not a long gecko tail
- Dark slate grey-green + pale bone rim; matte, zero metal
- One connected creature; no extra crab legs
- Stylized low-poly toon planes; Meshy High Detail is only to keep structure

## Reject immediately (do not download as a keeper)

| Failure | Why |
| --- | --- |
| Eight legs / extra side legs / swimmerets | Breaks the four-limb lock. Cannot reuse the verified 27-bone quadruped rig. |
| Turtle dome or overlapping pangolin shingles | Reads as a scaled Shell / 叠岩甲蜥. The whole point of a boss model is that it is not an enlarged grunt. |
| Paper-thin pincer wafers | Fragile Meshy topology. The thickened source exists specifically to prevent this. |
| Long gecko / lizard body | Wrong body plan; indistinguishable from player forms at the gameplay camera. |
| Legs or pincers present in texture but not as separate volumes | Cannot rig four tracked contacts (standard rule 3). |
| Photoreal scale noise as the primary surface | High Detail is source fidelity, not a license to ship microdetail. |

Record every further attempt in the contract generation-attempts table with date, method and outcome. Attempt count is this branch's primary deliverable: first modelled boss, first production-cost number for the valley gate.

## Documented Meshy UI settings

Only settings already recorded on prior jobs. Do not invent topology / polycount / texture-style toggles that were never written down.

1. **Image to 3D**, not Text to 3D. Text-to-3D is forbidden for this form (`PRODUCTION-MODEL-CONTRACT-V1.md`).
2. **High Detail** (coral-gecko source: Meshy 5 legacy, High Detail, single-image; scarlet-hunter and stone-pangolin: High Detail keeps structure, runtime still retopologises).
3. **Single-image reconstruction** unless the UI has a dedicated extra-view slot. If it does, add side then front as views 2 and 3. Never paste three drawings into one image.
4. **Download the textured GLB** (coral-gecko original filename pattern `*_texture.glb`).
5. **Do not run Meshy Walking / Auto-rig yet.** Contract acceptance sequence: silhouette review against this pack before any rigging.

Record whatever license this job actually uses; do not assume it. Shell selected a private licence — keep the evidence with this file when you have it.

## Next step after the GLB lands

1. Put the file in this folder and fill the downloaded / filename / SHA-256 / license fields.
2. Compare front, side and 3/4 against the contract: four limbs, thick paddle pincers, span wider than the body, V visor, layered plates, tucked tail plate, not a turtle, not a pangolin.
3. If it fails, keep the file as a numbered rejected candidate and run another Image to 3D job. Do not "fix it in Blender" to invent a different animal.
4. If it passes, stop. Blender cleanup, retopology, form-specific rig and the two gate attacks are a later task. Do not overwrite coral-gecko, scarlet-gecko, stone-pangolin, scarlet-hunter or any other runtime file.
