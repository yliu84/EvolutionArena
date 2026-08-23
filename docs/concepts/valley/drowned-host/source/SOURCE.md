# Valley drowned host / 溺囊 source record

Status: **Meshy job pack, awaiting user-supplied GLB.** Do not start Blender cleanup, retopology or rigging until the downloaded mesh passes the silhouette gates below.

The first lizard/salamander body was rejected because it read as the player. This pack is the replacement: a squat tailless toad with one connected glowing back sac.

- Prepared: 2026-08-19; toad revision 2026-08-23
- Identity: 河谷群生族小怪 / 溺囊 (`drowned-host`)
- Source type: user-run Meshy Image to 3D from the accepted toad 3/4 concept
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
| 1 | **Primary reconstruction image** (3/4 standing toad) | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-drowned-host-concept.png` |
| 2 | Extra view — right profile: squat rump, **no tail**, sac covering the back | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-drowned-host-toad-side-right.png` |
| 3 | Extra view — left profile, exact horizontal mirror of view 2 | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-drowned-host-toad-side-left.png` |
| 4 | Extra view — front: four short planted legs, wide mouth, sac as one mass | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-drowned-host-toad-front.png` |
| 5 | Extra view — top: one connected dorsal sac, oval body, no tail | `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-drowned-host-toad-top.png` |

If the UI has only one extra-view slot, use the **right** profile. If it has two, add **front**. Use top only as a third extra slot.

Do **not** upload:

- Any file whose name starts with `superseded-lizard-` (old tailed salamander)
- Swarm stage-1 荧囊猎蜥
- Other valley concepts
- Any combined turnaround board

## Meshy prompt (paste English)

```
Stylized low-poly toon game creature. A squat, fat, wide, flattened toad-like amphibian, four legs planted, crouched low, deep blue-green wet skin. NO TAIL. The entire back is covered by one connected glowing cyan translucent egg-sac, like fused glowing berries. Round calm head, large gentle rounded cyan eyes, soft closed mouth with no frown. Four thick short legs, visible toes, all planted. Neutral grey background, one complete creature, three-quarter standing pose, no text, no extra views.

Not a lizard, not a gecko. No tail, no dorsal spines, no long snout, no wings, no pincers.
```

Chinese copy (do not paste unless the UI is in Chinese; keep as the project translation):

```
风格化低面卡通游戏生物概念图。一只矮胖宽扁的蟾蜍状两栖类，四条腿着地低伏，深蓝绿色湿润皮肤。没有尾巴。背上覆盖一整团相连的发光青色半透明卵囊，像融在一起的发光浆果。圆而平静的头，大而柔的青色圆眼，嘴轻轻闭上，不皱眉。四条粗短腿，脚趾可见，全部着地。中性灰背景，只有一只完整生物，四分之三站姿，无文字、无多视图。

不是蜥蜴，不是壁虎。没有尾巴、没有背棘、没有长吻、没有翅膀、没有钳子。
```

## Must-keep constraints

- Exactly four planted legs with visible toes
- **No tail.** A tailless squat toad is what stops it reading as the player gecko
- **One connected glowing sac covering the back** — the Swarm family identity
- Dark blue-green wet body so the glow is the only bright thing
- Small round calm head, soft closed mouth, large gentle rounded cyan eyes; no frown or scowl
- One connected creature; no detached eggs
- Stylized low-poly toon planes; Meshy High Detail is only to keep structure

## Reject immediately (do not download as a keeper)

| Failure | Why |
| --- | --- |
| A tail of any length | Reads as the player gecko. This concept exists to break that silhouette. |
| Lizard / gecko / salamander body | Same failure as the superseded first concept. |
| Six or eight legs | Breaks the four-limb lock. Cannot reuse the verified 27-bone quadruped rig. |
| The sac split into scattered spots or floating eggs | The glow is the read at camera distance; scattered speckles vanish in fog. |
| Overlapping pangolin shingles | That is the player's Shell stage-1 body. |
| Long snout raptor build | That is 浅滩裂牙. |
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
2. Compare front, both sides, top and 3/4 against the contract: four short legs, **no tail**, one connected glowing back sac, squat toad, not a gecko.
3. If it fails, keep it as a numbered rejected candidate and run another job. Do not "fix it in Blender" to invent a different animal.
4. If it passes, the remaining work is cleanup, the quadruped rig, scale to the Swarm collision radius 0.64, and one line in the body registry.
