# Valley drowned host / 溺囊 source record

Status: **on hold — the concept was rejected at review.** See the contract: this
form reads as the player, and so do the other two stock concepts for the slot.
The glowing brood sac survives; the lizard body does not. Do not run this prompt
as written.

Original status: **Meshy job pack, awaiting user-supplied GLB.** Do not start Blender cleanup, retopology or rigging until the downloaded mesh passes the silhouette gates below.

- Prepared: 2026-08-19
- Identity: 河谷群生族小怪 / 溺囊 (`drowned-host`)
- Source type: user-run Meshy Image to 3D from the accepted 3/4 concept
- Contract: `../PRODUCTION-MODEL-CONTRACT-V1.md`
- Generation service: Meshy web application, generated and supplied by the user for this project
- Downstream runtime (not this step): `public/assets/quality-3d/models/drowned-host-runtime-v1.glb`

When Meshy finishes, drop the downloaded textured GLB into **this folder**. Keep the original Meshy filename, then record it, the SHA-256 and the selected license in the blank fields below. The source GLB is immutable.

- Downloaded:
- Original Meshy filename:
- Stored source:
- SHA-256:
- License selected in Meshy:
- Required attribution: identify Meshy as the generation tool in public asset or game credits (same rule as every other model in this project)

Exact commercial-license/account evidence must be retained by the project owner before public release. This record does not invent terms that were not supplied with the download.

## Upload order

These are already separate images. Do **not** collage them into one sheet. Scarlet-hunter already proved a multi-pose board in a single-image job merges several bodies into one mesh.

| Order | Role | File |
| --- | --- | --- |
| 1 | **Primary reconstruction image** (3/4 standing pose) | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-drowned-host-concept.png` |
| 2 | Extra view — right profile: length vs height, tail ≈ body, sac as one mid-back hump | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-drowned-host-meshy-source-side-right.png` |
| 3 | Extra view — left profile, exact horizontal mirror of view 2 | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-drowned-host-meshy-source-side-left.png` |
| 4 | Extra view — front: four planted legs, one central cyan eye, sac peeking as one mass | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-drowned-host-meshy-source-front.png` |
| 5 | Extra view — top: one connected dorsal sac, tail = body, one eye | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-drowned-host-meshy-source-top.png` |

If the UI has only one extra-view slot, use the **right** profile. If it has two, add **front**. Use top only when there is a dedicated third extra slot: it locks the sac, but the toes are busier than the three-claw rule and must not overwrite the side/front feet.

Do **not** upload the other valley concepts, the Swarm stage-1 荧囊猎蜥 pack, or any combined turnaround board.

## Meshy prompt (paste English)

```
Stylized low-poly toon game character. A small dark river salamander creature: deep blue-green scaled body, low four-legged stance, blunt rounded head with one glowing cyan eye, small low spines along the back line, tapering tail about as long as the body. On its back sits a single cluster of glowing cyan translucent eggs, like a bunch of round bio-luminous berries fused into one raised sac. Scattered small cyan dots along the flanks. Four stout legs, each with three visible dark claws, all planted on the ground. Matte damp skin, no metal, no gloss highlights. Neutral grey background, one complete standing creature, no extra views or text in the image.

EXACTLY FOUR LEGS. Not six insect legs, not a crab, not a pangolin with overlapping shingles, not a gecko, not a turtle. No wings, no pincers, no rider, no floating parts. The glowing sac must be ONE connected mass on the back, not scattered spots and not separate floating eggs.
```

Chinese copy (do not paste unless the UI is in Chinese; keep as the project translation):

```
风格化低面卡通游戏角色。一只深色小型河生蝾螈类生物：深蓝绿鳞体，四足低伏站姿，钝圆头部带一只发光青色眼睛，背脊有一排低矮小棘，尾长约与身体相当。背上有一团发光的青色半透明卵囊，像一簇圆润的发光浆果融成一个隆起的囊。体侧散布细小青点。四条粗壮腿，每条三只深色爪，全部着地。哑光湿润皮肤，无金属、无高光。中性灰背景，画面里只有一只完整站姿生物，不要拼小图或文字。

恰好四条腿。不要六足昆虫、螃蟹、叠瓦穿山甲、壁虎或乌龟。不要翅膀、钳子、骑手或漂浮零件。发光卵囊必须是背上一整块相连的团，不是散点，也不是分离的悬浮卵。
```

## Must-keep constraints

- Exactly four planted legs with visible claws
- **One connected glowing sac on the back** - this is the identity, and the reason this concept was chosen for the Swarm family
- Dark blue-green body so the glow is the only bright thing on it
- Low salamander stance, tail about body length
- One connected creature; no detached eggs
- Stylized low-poly toon planes; Meshy High Detail is only to keep structure

## Reject immediately (do not download as a keeper)

| Failure | Why |
| --- | --- |
| Six or eight legs | Breaks the four-limb lock. Cannot reuse the verified 27-bone quadruped rig. |
| The sac split into scattered spots or floating eggs | The glow is the read at camera distance; scattered speckles vanish in fog. |
| Overlapping pangolin shingles | That is the player's Shell stage-1 body. |
| Long snout raptor build | That is 浅滩裂牙, the Fang prey it stands next to. |
| Bright body with a dim sac | Inverted read. The body is dark so the sac carries. |
| Photoreal skin noise as the primary surface | High Detail is source fidelity, not a license to ship microdetail. |

## Documented Meshy UI settings

Only settings already recorded on prior jobs. Do not invent toggles that were never written down.

1. **Image to 3D**, not Text to 3D.
2. **High Detail**.
3. **Single-image reconstruction** unless the UI has a dedicated extra-view slot. If it does, add right profile then front. Use top only as a third extra. Never paste several drawings into one image.
4. **Download the textured GLB.**
5. **Do not run Meshy Walking / Auto-rig yet.** Silhouette review first.

Record whatever license this job actually uses; do not assume it.

## Next step after the GLB lands

1. Put the file in this folder and fill the downloaded / filename / SHA-256 / license fields.
2. Compare front, both sides, top and 3/4 against the contract: four legs, one connected glowing back sac, dark body, low stance, not a pangolin, not a six-leg insect.
3. If it fails, keep it as a numbered rejected candidate and run another job. Do not "fix it in Blender" to invent a different animal.
4. If it passes, the remaining work is mine: `meshy_cleanup.py`, the quadruped rig, scale to the Swarm collision radius 0.64, and one line in the body registry. The valley then has no primitives left on it.
