# Shell stage-2 / 磐岳甲龙 source record

Status: **revision-3 color pass generated 2026-08-23; awaiting user review of
the 3/4.** Board-1, board-2, and the first board-3 grey-mass pass are archived.
Do not run Meshy until the owner confirms the new 3/4. Do not upload any
superseded-board file.

1. ~~Generate the concept board.~~ Board-1 and board-2 rejected. Board-3
   architecture held; first pass read as a solid grey pile and was replaced.
2. **Owner reviews the 3/4.** Legs tree-trunk thick at about one third of
   height; upright shoulder and hip slabs break the silhouette; teal hide and
   yellow-green lichen show between slabs; cream throat and belly stay bright.
   Do not collage a fix.
3. **Run Meshy Image-to-3D** from the accepted board, using the upload order
   and Meshy prompt below.

Do not start Blender cleanup, retopology or rigging until the downloaded mesh
passes the silhouette gates.

- Prepared: 2026-08-24
- Identity: 瓢甲二级 stage-2 (`shell` family), successor to `stone-pangolin` / 叠岩甲蜥
- Provisional names: `basalt-bulwark` / 磐岳甲龙 — **not locked**, must not enter
  runtime strings until the user confirms (`brood-stalker` precedent)
- Contract: `../PRODUCTION-MODEL-CONTRACT-V1.md`
- Direction: **B 立起**, world height **2.55**, chosen by the user 2026-08-24
- Generation service: Meshy web application, generated and supplied by the user
- Downstream runtime (not this step): `public/assets/quality-3d/models/basalt-bulwark-rigged-v1.glb`

When Meshy finishes, drop the downloaded textured GLB into **this folder**.
Keep the original Meshy filename, then record it, the SHA-256 and the selected
license below. The source GLB is immutable; derived cleanup/rig files use
separately named paths.

- Downloaded: 2026-08-24 (file dated 2026-08-23 21:29)
- Original Meshy filename: `Meshy_AI_model_Animation_Walking_withSkin (8).glb`
- Stored source: `docs/concepts/evolution-v2/shell-stage2/source/Meshy_AI_model_Animation_Walking_withSkin (8).glb` (7,840,056 bytes)
- SHA-256: `1cd240cd3616fa47164517f27e603dc3cdc810afa68f77aac0dfed75d1ffbde6`
- License selected in Meshy: covered by the project owner's active Meshy Pro
  subscription. Evidence is a dated model-library card from 2026-08-23 supplied
  by the owner on 2026-08-24, matching the treatment of every earlier batch in
  `docs/ASSET-LICENSE-REGISTER.md`. The card and the billing record stay in the
  owner's private archive.

### Accepted source — measurements, 2026-08-24

Measured from the creature mesh `char1` in bind pose, with the Meshy `Icosphere`
helper excluded:

| Property | Gate | Measured | |
| --- | --- | --- | --- |
| l/h | ≤ 2.20 | **1.980** | PASS |
| w/h | ≥ 0.95 | **1.059** | PASS |

At world height 2.55: **2.70 wide × 5.05 long × 2.55 tall** — the widest body in
the game (Fang stage 2 is 2.03). Against stage-1 Shell at 1.59 × 4.58 × 1.80
that is **+70% width, +10% length, +42% height**: growth upward and outward, not
longer, exactly as §3 requires.

- 20,660 triangles — already inside the contract's 20,000–24,000 runtime budget,
  so **no staged decimation is needed**. The stage-1 Shell source was 1,986,110.
- 27 joints, node names matching the shared Meshy quadruped template
  (`tail1..3`, `backleg`, `R_backleg`, …), so the existing rig mapping applies.
- One material, one 6,726,874-byte PNG — downsize to 1024 in processing.
- One clip only, `Armature|Unreal Take|baselayer`. The nine named clips are
  authored in Blender, as for every other form.

**The `Icosphere` helper must be deleted in processing.** It is 2.0 units across
against a creature 0.017 units across, so it *is* the bounding box until removed:
it silently corrupted two separate review measurements and rendered the first
turntable as a single speck. `resolveQuality3DGLBAsset` consumers hide it at
runtime, but processing deletes it.

**Resolved: the slab height-budget question raised on board-3.** The upright
slabs take roughly 22% of total height, putting the body itself near 1.99
against stage 1's 1.80 — about +10%. On its own that is weak, but width grew
70%, and mass reads from width and height together. **Accept as-is: do not
shorten the slabs and do not change the 2.55 world height.** This chooses option
1 of the three recorded on board-3, and it is now chosen from measurement rather
than from a perspective drawing.

Note: the owner ran Meshy's Walking / auto-rig step, which this pack had said to
defer until after silhouette review. The outcome was better than the rule — it
produced exactly the 27-bone template the pipeline wants. No corrective action.
- Required attribution: identify Meshy as the generation tool in public asset or
  game credits (same rule as coral-gecko / scarlet-gecko / stone-pangolin /
  spore-stalker). The runtime now renders this in the Settings panel and
  `tests/asset-credit.test.ts` checks it against `docs/ASSET-LICENSE-REGISTER.md`.

Exact commercial-license/account evidence must be retained by the project owner
before public release. This record does not invent terms that were not supplied
with the download.

---

## Stage 1 — concept board

Four **separate** images. Do not collage them. Save into
`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/` with these names:

| # | Role | Filename |
| --- | --- | --- |
| 1 | Primary — 3/4 standing | `shell-stage2-bulwark-three-quarter.png` |
| 2 | True side (corrects body length; **mandatory**) | `shell-stage2-bulwark-side.png` |
| 3 | Front (limb spacing, symmetry) | `shell-stage2-bulwark-front.png` |
| 4 | Top (the surface the player actually reads) | `shell-stage2-bulwark-top.png` |

View 2 is mandatory and not an optional extra. Stage-1 attempt 2 came back at
l/h 3.23 because the 3/4 view foreshortened the body and the generator guessed
it long; the true side view corrected it to 2.54.

View 4 matters more here than on any previous creature: the camera sits at ~36°
pitch, so the dorsal tiering is what the player sees for the entire run, and it
is the property that keeps this form from reading as a front-loaded shield.

Board-1 rejected 2026-08-24 (archived `superseded-board1-*`): low-slung
ankylosaur, legs ~26% of height, head tucked at or below the shoulder.

Board-2 rejected 2026-08-23 (archived `superseded-board2-*`): tall thin stilts,
small torso, reads light. "还是不合适."

Board-3 first pass archived `superseded-board3-grey-mass-*`: architecture
held, but the body read as a solid grey pile. Color pass 2026-08-23: teal hide
and yellow-green lichen stay visible as connective tissue between slabs;
cream throat and belly stay bright. Same mass, same slabs, same upright
clusters, same club.

### Canonical body description — REVISION 3 (English — paste as the image prompt)

REVISION 2 was rejected on 2026-08-24 as "too ugly": its gates passed and it
destroyed the form's mass doing so. **MASS is the subject of this revision.**
Separation from stage 1 comes from plate *architecture* — few huge megaliths
instead of many small shingles, plus upright standing slabs rising from the
spine — not from standing height. Legs return to short thick columns. Prepend
the per-view line, then this block.

```
Stylized low-poly toon game character concept, neutral grey background, one complete creature, no text, no extra views, no collage.

A colossal, extremely heavy armoured saurian — a walking piece of cliff. MASS is the subject of this design. The torso is enormous, deep and barrel-like, and it dominates the silhouette; the creature is built like an elephant or a rhinoceros, not like a cow or a horse.

Four SHORT, immensely THICK stone-plated legs, as thick as tree trunks, spaced wide apart. The legs are roughly one third of the total standing height — short and columnar, carrying a huge body just clear of the ground. A modest gap of background is visible under the belly. The legs must never look thin, long or stilt-like. Broad splayed feet with heavy blunt claws.

The armour is made of FEW and VERY LARGE fused megalith slabs — big angular blocks of cracked grey basalt, like broken cliff rock, each one huge relative to the body. Not small shingles, not scales, not a smooth dome. The slabs interlock with deep dark seams. Between the stone slabs, the dark teal-green hide and yellow-green lichen must remain clearly visible as connective tissue — the creature must never read as a solid grey mass. The slabs wrap the back, both flanks and the tail.

Rising from the spine are two clusters of tall UPRIGHT standing stone slabs, like standing stones or a broken ridgeline — one cluster over the shoulders and one over the hips, equal in height. These break the outline dramatically against the sky. The back between and around them is still fully plated; the upright slabs are additional mass, not a replacement for coverage.

A massive heavy plated skull with a thick brow shelf over one amber eye, carried forward at shoulder height on a short powerful neck.

Short thick plated tail ending in a heavy fused stone club.

Dark teal-green hide beneath the stone, cream underbelly and throat, amber eye. Cream throat and underbelly stay bright. Matte, zero metalness, no glow. Light stone against dark hide.

Between the stone slabs, the dark teal-green hide and yellow-green lichen must remain clearly visible as connective tissue — the creature must never read as a solid grey mass. Cream throat and underbelly stay bright.

Not thin-legged. Not tall and leggy. Not an ankylosaur with small scutes. Not a smooth turtle dome. No raised prow, no ram, no shield boss, no frontal crest — the mass is spread along the whole back.
```

The tail club is in the owner's revision-3 prompt and stays on this board.

**Three self-checks before generating the other three views.**

1. **Are the legs thick?** Tree-trunk thick, about a third of standing height.
   Columns, not stilts.
2. **Does the upright slab cluster break the outline?** Squint at the
   silhouette. If it is still a rounded mound, it failed.
3. **Do hide and lichen show between the slabs?** Dark teal-green connective
   tissue and yellow-green lichen must stay readable. Cream throat and belly
   stay bright. A solid grey mass fails — the valley already has grey boulders.

The earlier "fold the image in half, do the legs reach the middle" check is
**withdrawn** — passing it is what produced the rejected REVISION 2 board.

### Canonical body description — REVISION 2 (superseded 2026-08-24)

Revision 1 was rejected on 2026-08-24: it produced the stage-1 body plan again.
See the contract's attempts table for the root cause. **Stance is the subject of
this revision**, and it carries a number the generator can act on, because
stance is the only property of this form that is resolvable at 13.3% screen
height. Prepend the per-view line, then this block.

```
Stylized low-poly toon game character concept, neutral grey background, one complete creature, no text, no extra views, no collage.

A towering armoured saurian bulwark standing HIGH on four long pillar legs, carried like a rhinoceros or a bull — NOT a low-slung ankylosaur. The legs are the subject of this design: straight vertical columns of stone-plated muscle, and they make up a full HALF of the creature's total standing height. A large open gap of empty background is clearly visible under the belly, between the front and back legs. The belly is carried high, well above the knees.

The torso is compact and blocky and sits high on those legs: total length barely twice the standing height, torso nearly as wide as it is tall. Broad splayed feet with blunt claws.

The back carries overlapping grey basalt plates in two or three stepped tiers running the full body length, equally tall over the shoulders and over the hips. Every plate has real thickness and a hard lifted lip where it overlaps the next; seams deep and dark, packed with yellow-green lichen.

The head is held HIGH, at or above the shoulder line, well clear of the shell rim — a heavy plated skull, one amber eye. Not tucked, not hidden under a rim, not lowered to the ground.

The tail is short, thick, plated, and ends in a heavy fused stone club.

Dark teal-green hide beneath the plates, cream underbelly and throat, amber eye. Matte, zero metalness, no glow. Light stone against dark hide.

Not an ankylosaur. Not a pangolin. Not a turtle. Not low to the ground. No raised prow, no ram, no shield boss, no frontal crest — the armour mass is spread evenly along the whole back.
```

The tail club is now **in the owner's pasted prompt**, so it is part of this
board, not an open proposal. If the owner later declines it, delete that line
and restore `Thick tail plated to the tip, shorter than the torso, held low.`

**Self-check before generating anything else.** Fold the image in half
horizontally: do the legs reach the halfway line? If not, regenerate and go no
further. This gate outranks plate quality — individual plates are not resolvable
at 144 px, and stance is.

### Canonical body description — REVISION 1 (superseded 2026-08-24)

Prepend the per-view line, then this block.

```
Stylized low-poly toon game character concept, neutral grey background, one complete creature, no text, no extra views, no collage.

A heavy armoured quadruped saurian bulwark, standing tall and clear of the ground. Body is broad and blocky rather than long: nearly as wide as it is tall, and its total length is barely twice its standing height. Four short thick stone-column legs, straight and load-bearing, with heavy ankles and broad splayed feet ending in blunt claws; all four legs and feet are fully visible below the armour skirt, and there is a clear open gap between the belly and the ground.

The back carries continuous overlapping grey basalt plates across the back, both flanks and the whole tail, stacked into two or three raised tiers that run the full length of the body and are equally tall over the shoulders and over the hips. Every plate has real thickness and a hard lifted lip where it overlaps the next; the seams are deep and dark, packed with yellow-green lichen. No bare smooth panel anywhere on the back.

A heavy plated skull, held forward on a short thick neck, with a low brow ridge over one amber eye. The head is clear of the shell rim but the neck is short and blocky — not raised, not on a stalk.

Thick tail plated to the tip, shorter than the torso, held low.

Dark teal-green hide beneath the plates, soft cream underbelly and throat, amber eye. Matte, zero metalness, no glow. Light stone against dark hide, strong value separation.

Not front-heavy: the armour mass is spread evenly along the whole back, with no raised prow, no ram, no shield boss, no crest at the front.
```

### Per-view opening lines

| # | Prepend |
| --- | --- |
| 1 | `Three-quarter view from slightly above, front-left, standing at rest.` |
| 2 | `Strict side view, perfectly orthographic, full body from nose to tail tip, no perspective foreshortening.` |
| 3 | `Strict front view, perfectly orthographic, symmetrical, showing the spacing of all four legs.` |
| 4 | `Strict top-down view looking straight down at the back, showing the full plate tiering from nose to tail tip.` |

### Chinese copy (project translation — paste only if the UI is Chinese)

```
风格化低面卡通游戏角色概念图，中性灰背景，画面中只有一只完整生物，无文字、无多视图拼接。

一只极其沉重的巨型装甲甲龙——会走的悬崖。质量是这张设计的主语。躯干巨大、深、像酒桶，主导剪影；体型像象或犀牛，不像牛或马。

四条短而极粗的石甲腿，像树干，分得很开。腿大约占站立高度的三分之一——短柱，把巨大身躯刚刚抬离地面。腹下有一小块空背景。腿绝不能细、长或像高跷。脚掌宽外撇，钝重爪。

装甲是少数几块非常大的熔铸巨石板——裂纹灰玄武岩的大块棱角崖石，每块相对身体都巨大。不是小叠瓦，不是鳞，不是光滑圆顶。石板咬合。石板之间必须清楚露出深青绿皮肤和黄绿地衣，当作连接组织——整只生物绝不能读成一团实心灰。石板包裹背、两肋和尾。

脊背上竖起两簇高高的立石，像石阵或断裂的山脊——一簇在肩，一簇在臀，一样高。它们剧烈打断天空轮廓。立石之间和周围的背仍铺满石板；立石是额外质量，不是覆盖的替代。

巨大厚重的装甲头骨，粗眉架下一只琥珀眼，短而有力的颈把头送到肩高、向前。

尾短粗包甲，末端一枚熔铸石锤。

石下是深青绿皮肤，腹与喉奶白，琥珀眼。奶白喉腹保持明亮。哑光，零金属度，不发光。浅石对深皮。

不要细腿。不要又高又细。不要带小鳞甲的甲龙。不要光滑龟壳。没有翘起的船首、撞角、盾心、前冠——质量沿整条背分布。
```

---

## Stage 2 — Meshy upload order

| Order | Role | File |
| --- | --- | --- |
| 1 | **Primary reconstruction image.** Use this alone if Meshy is in single-image mode. | `shell-stage2-bulwark-three-quarter.png` |
| 2 | Extra view — true side | `shell-stage2-bulwark-side.png` |
| 3 | Extra view — front | `shell-stage2-bulwark-front.png` |

View 4 (top) is for **your silhouette review**, not for upload — Meshy's extra
view slots are side and front. Use it to confirm the tiering reads from above
before you spend a job on the mesh.

Do **not** upload:

- any stage-1 `shell-stage1-concept-*` image (that job produces 叠岩甲蜥 again)
- `shell-stage1-concept-c-buckler-head.png` — banked as a Shell-**enemy** target;
  its front-loaded shield is a literal description of the enemy's ±75.6° frontal
  rule, which the player form does not have
- `evo-dir-shell.png` (choice-card atmosphere)
- any combined turnaround or attack-pose board
- any `superseded-board1-shell-stage2-bulwark-*` file (rejected stage-1 body)
- any `superseded-board2-shell-stage2-bulwark-*` file (rejected tall stilts)
- any `superseded-board3-grey-mass-*` file (architecture held, read as a solid grey pile)

### Meshy prompt (paste English with image 1)

```
Stylized low-poly toon game character. A colossal extremely heavy armoured saurian — a walking piece of cliff. MASS is the subject. Enormous deep barrel torso like an elephant or rhinoceros, not a cow or a horse. Four SHORT immensely THICK stone-plated legs, tree-trunk thick, wide apart, roughly one third of standing height, carrying a huge body just clear of the ground. Modest belly gap. Legs must never look thin, long or stilt-like. Broad splayed feet with heavy blunt claws. Armour of FEW VERY LARGE fused megalith slabs — big angular cracked grey basalt cliff blocks, not small shingles, not scales, not a smooth dome. Between the stone slabs, the dark teal-green hide and yellow-green lichen must remain clearly visible as connective tissue — the creature must never read as a solid grey mass. Slabs wrap back, both flanks and the tail. Two clusters of tall UPRIGHT standing stone slabs, one over the shoulders and one over the hips, equal height, breaking the skyline; the back between them is still fully plated. Massive plated skull with a thick brow shelf, one amber eye, carried forward at shoulder height on a short powerful neck. Short thick plated tail ending in a heavy fused stone club. Dark teal-green hide, cream underbelly, amber eye. Cream throat and underbelly stay bright. Matte, zero metalness. Neutral grey background, one complete standing creature, no extra views or text.

Not thin-legged. Not tall and leggy. Not an ankylosaur with small scutes. Not a pangolin. Not a turtle. No raised prow, no ram, no shield boss, no frontal crest. No spinal spike ridge instead of plate coverage. No elongated body. No coral-red, no orange crest, no cyan glow, no metal.
```

Chinese copy — do not paste unless the UI is in Chinese:

```
风格化低面卡通游戏角色。一只极其沉重的巨型装甲甲龙——会走的悬崖。质量是主语。巨大深桶状躯干，像象或犀牛，不像牛或马。四条短而极粗的石甲腿，树干粗，分得很开，约占站立高度三分之一，把巨大身躯刚刚抬离地面。腹下有一小块空隙。腿绝不能细、长或像高跷。脚掌宽外撇、钝重爪。装甲是少数几块非常大的熔铸巨石板——裂纹灰玄武岩大块崖石，不是小叠瓦、鳞或光滑圆顶。石板之间必须清楚露出深青绿皮肤和黄绿地衣，当作连接组织——绝不能读成一团实心灰。石板包裹背、两肋和尾。脊背上两簇高立石，一簇在肩、一簇在臀，一样高，打断天空轮廓；立石之间的背仍铺满石板。巨大装甲头骨，粗眉架，一只琥珀眼，短颈送到肩高向前。尾短粗包甲，末端熔铸石锤。深青绿皮肤，奶白腹，琥珀眼。奶白喉腹保持明亮。哑光，零金属度。中性灰背景，只有一只完整站姿生物，不要拼小图或文字。

不要细腿。不要又高又细。不要带小鳞甲的甲龙。不要穿山甲、乌龟。不要翘起船首、撞角、盾心、前冠。不要用脊刺代替甲片覆盖。不要拉长的身体。不要珊瑚红、橙色冠、青色发光、金属。
```

## Must-keep constraints

- Quadruped, four **short, tree-trunk-thick** legs, four planted feet
- Legs roughly **one third** of standing height; modest belly gap; never thin
  or stilt-like
- Broad and massive: **length ≤ 2.20 × height**, **width ≥ 0.95 × height**
- Armour of **few very large megalith slabs**, not small shingles
- Two **upright standing-stone clusters**, one over the shoulders and one over
  the hips, equal height, additional to full back coverage
- Head carried **forward at shoulder height** on a short powerful neck
- Tail shorter than the torso, plated, ending in a **fused stone club**
- Grey basalt / dark teal-green hide / cream belly / yellow-green lichen / amber eye
- Hide and lichen **visible as connective tissue between slabs**; cream throat
  and belly stay bright; never a solid grey mass
- Matte, zero metalness, no emissive glow

## Reject immediately (do not download as a keeper)

| Failure | Why |
| --- | --- |
| Elongated body, l/h above 2.20 | The runtime scales by height alone, so at 2.55 this becomes a 6.5-unit body — longer than anything in the game. Cannot be fixed downstream. |
| Raised prow, ram, shield boss, frontal crest | Promises a directional mitigation rule the player does not have. Player damage has no facing term. |
| Thin, long or stilt-like legs | Board-2 failure. The form reads light. Legs are short tree trunks, about one third of height. |
| Many small shingles / scutes, no megalith slabs | Board-1 language. Stage 2 separates by plate architecture, not stance. |
| Rounded mound with no upright shoulder and hip slabs | The standing stones are the distant evolution read. They are additional mass, not a substitute for coverage. |
| Solid grey mass; hide and lichen gone from the seams | First board-3 failure. The valley already has grey boulders. Cream throat and belly must stay bright. |
| Head tucked under a rim, or raised on a stalk | Forward at shoulder height on a short powerful neck. |
| Spinal spike ridge instead of plate coverage | Stage-1 attempt-1 failure. Upright slabs sit on full coverage; they do not replace it. |
| Single fused smooth dome, or turtle shell | Few huge angular slabs are the identity. |
| Long smooth tapering tail | Reproduces the gecko read. |
| Coral-red / orange crest / cream Fang palette | Wrong family. That is Fang. |
| Cyan glow, spore sac, near-black teal | Wrong family. That is Swarm. |
| Biped or rearing pose | Cannot rig or sell a quadruped gait. |
| Photoreal scale noise as the primary surface | High Detail is source fidelity, not a license to ship microdetail. Nothing below ~144 px is resolvable. |

## Documented Meshy UI settings

Only settings already recorded on prior jobs. Do not invent topology / polycount
/ texture-style toggles that were never written down.

1. **Image to 3D**, not Text to 3D. Text-to-3D is forbidden for this line —
   stage-1 attempt 1 proved `lizard` / `reptile` / `quadruped` dominate the
   generator's prior and reduce armour to bolted-on decoration.
2. **High Detail** — keeps structure; the runtime still retopologises.
3. **Single-image reconstruction** unless the UI has a dedicated extra-view
   slot. If it does, add side then front as views 2 and 3. Never paste several
   drawings into one image.
4. **Download the textured GLB.**
5. **Do not run Meshy Walking / Auto-rig yet.** Silhouette review against this
   pack comes first.

Record whatever license this job actually uses; do not assume it.

## Next step after the GLB lands

1. Put the file in this folder and fill the downloaded / filename / SHA-256 /
   license fields.
2. Run the proportion gate **before** looking at anything else. It is
   arithmetic, not taste, and it is the one property that cannot be rescued in
   Blender. No Blender needed:

   ```bash
   node scripts/measure-glb-proportions.mjs --height 2.55 --max-lh 2.20 --min-wh 0.95 <the-downloaded>.glb
   ```

   It prints `w/h`, `l/h`, the resulting world size at 2.55, and PASS/FAIL per
   gate; it exits non-zero on any failure. For reference, the stage-1 body fails
   both gates (`2.25 x 6.48 x 2.55`) — that is the whole reason this form needs
   a new mesh rather than a bigger one.
3. Compare front, side, 3/4 and top against the contract: quadruped, short
   tree-trunk legs ~one third height, modest belly gap, few huge megaliths,
   upright shoulder and hip slabs, head at shoulder height, fused stone club,
   no frontal mass.
4. If it fails, keep the file as a numbered rejected candidate and run another
   Image-to-3D job. Do not "fix it in Blender" to invent a different animal.
5. If it passes, stop. Blender cleanup, retopology, the 27-bone rig and the
   `Bite → Slam → TailSwipe` clips are a later task. Do not overwrite
   coral-gecko, scarlet-gecko, scarlet-hunter, stone-pangolin or spore-stalker
   runtime files.
