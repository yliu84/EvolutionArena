# Swarm stage-1 / 荧囊猎蜥 source record

Status: **Meshy job pack, awaiting user-supplied GLB.** Do not start Blender cleanup, retopology or rigging until the downloaded mesh passes the silhouette gates below.

- Prepared: 2026-08-17
- Identity: 群生一级 / 荧囊猎蜥 stage-1 (`brood-stalker` lineage, `swarm` family)
- Provisional model name: `brood-stalker` / 荧囊猎蜥 (Chinese display name is not locked for runtime strings)
- Source type: user-run Meshy Image to 3D from the accepted concept B, compact revision (high flank sac, short tail)
- Contract: `../PRODUCTION-MODEL-CONTRACT-V1.md`
- Generation service: Meshy web application, generated and supplied by the user for this project
- Downstream runtime (not this step): `public/assets/quality-3d/models/brood-stalker-rigged-v1.glb`

When Meshy finishes, drop the downloaded textured GLB into **this folder** (`docs/concepts/evolution-v2/swarm-stage1/source/`). Keep the original Meshy filename, then record it, the SHA-256 and the selected license in the blank fields below. The source GLB is immutable. Derived cleanup/rig files must use separately named paths.

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
| 1 | **Primary reconstruction image** (3/4 standing pose). Use this alone if Meshy is in single-image mode. | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/swarm-stage1-concept-b-flank-sac-three-quarter.png` |
| 2 | Extra view — side silhouette, compact body, short tail, high upper-flank sac | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/swarm-stage1-concept-b-flank-sac-side.png` |
| 3 | Extra view — front symmetry, limb spacing, dorsal sac glow | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/swarm-stage1-concept-b-flank-sac-front.png` |

Do **not** upload:

- Concept A whippet-gecko or concept C ventral-host
- Any file whose name contains `superseded-long-tail` (first B: long whip tail, belly sac, spindly legs)
- `evo-dir-swarm.png` (choice-card atmosphere: biped, fog, floating orbs)
- Any combined turnaround / attack-pose board

## Meshy prompt (paste English)

Meshy Image to 3D usually wants English. Paste this with image 1. The image carries the silhouette; the prompt only locks identity and rejects the known failure modes.

```
Stylized low-poly toon game character. A compact quadruped saurian stalker standing tall on four legs: short torso, short tail, high off the ground. Near-black teal matte hide. Hind legs longer and more powerful than the forelimbs, with visible thigh muscle and sturdy ankles — slender but solid, not spindly. Four planted three-clawed feet; legs must not fuse or become a biped. Small pointed head, short neck, one cyan glowing eye, a short row of small soft spines on the nape only. A large oval cyan spore sac glows through the skin high on the upper flank, just below the spine ridge, clearly visible from above; fused into the body, not a backpack or detached orb. A line of small cyan speckles along the spine from the shoulders to the tail base. Narrow chest. Short tapering tail held low and straight, no longer than the shoulder-to-hip distance. Neutral grey background, one complete standing creature, no extra views or text in the image.

Not a biped, not a raptor on two legs, not a gecko belly-crawler, not a pangolin, not a turtle. No long whip tail. No belly sac. No floating orbs, no swarm of small creatures, no armour plates, no coral-red, no orange crest, no giraffe neck.
```

Chinese copy (do not paste unless the UI is in Chinese; keep as the project translation):

```
风格化低面卡通游戏角色。一只紧凑的四足猎蜥，四腿高站：躯干短、尾巴短、身体高离地面。近黑青绿哑光皮肤。后腿长于前腿，大腿有肌肉、踝关节结实——细但实，不是竹竿腿。四足三爪踏地，腿不得融合或改成两足。头小而尖，颈短，一只青色发光眼，颈后一小排柔软短刺。椭圆形青色孢子囊长在上肋、紧贴脊线下方，俯视必须看得见，光从皮肤里透出、长在身上——不是背包也不是独立光球。肩到尾根有一排青色小斑。胸窄。尾短、低平、长度不超过肩到髋。中性灰背景，画面里只有一只完整站姿生物，不要拼小图或文字。

不要两足龙、贴地壁虎、穿山甲或乌龟。不要长鞭尾。不要肚皮光囊。不要漂浮光球、小虫群、甲片、珊瑚红、橙色冠、长颈鹿长颈。
```

## Must-keep constraints

- Quadruped, four planted feet, four separate legs
- Compact: tall on legs, short torso, short tail (tail ≤ shoulder-to-hip)
- Hind legs longer; thighs muscled, ankles sturdy; not spindly sticks
- Spore sac high on the **upper** flank, just below the spine ridge, readable from above
- Line of cyan speckles along the spine from shoulders to tail base
- Small pointed head, short neck, cyan eye, no coral crown
- Near-black teal hide; no Fang coral-red; no Shell stone plates
- One connected creature: no floating orbs, no extra broodlings
- Stylized low-poly toon planes; Meshy High Detail is only to keep structure

## Reject immediately (do not download as a keeper)

| Failure | Why |
| --- | --- |
| Biped / raptor on two legs with idle forelimbs | The choice-card atmosphere art already failed this way. Cannot rig four tracked feet or sell a quadruped gait. |
| Long low gecko / belly-crawler | Indistinguishable from stage 0 at the gameplay camera. |
| Pangolin / stone plates / turtle | Wrong family. That is Shell. |
| Coral-red raptor / orange crest / cream belly of Fang | Wrong family. That is Fang. |
| Floating orbs or a swarm of extra creatures | Runtime will never spawn them; Meshy will also tend to weld them into extra limbs. |
| Detached backpack sac, or a sac on the belly / lower flank | Must be a volume high on the upper flank, just below the spine, so the 36° gameplay camera can see it. |
| Long whip tail longer than the torso | Compact read fails; first B was rejected for this. |
| Legs present in texture but not as separate volumes | Cannot rig four tracked feet (standard rule 3). |
| Photoreal scale noise as the primary surface | High Detail is source fidelity, not a license to ship microdetail. |

Record every further attempt in the contract generation-attempts table with date, method and outcome. Attempt count is this branch's primary deliverable.

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
2. Compare front, side and 3/4 against the contract: quadruped, tall-short proportions, fused flank sac, four planted feet, no orbs, no plates, no red raptor.
3. If it fails, keep the file as a numbered rejected candidate and run another Image to 3D job. Do not "fix it in Blender" to invent a different animal.
4. If it passes, stop. Blender cleanup, retopology, form-specific rig and the `Bite → Pounce → TailSwipe` clips are a later task. Do not overwrite coral-gecko, scarlet-gecko, stone-pangolin or scarlet-hunter runtime files.
