# Gloamwood nest boss / 荆心守卫 source record

Status: **delivered 2026-08-24.** Board 3 was accepted, the owner ran Meshy from
it, and the processed body ships as
`public/assets/quality-3d/models/thornheart-warden-runtime-v1.glb`.

Board-1's thorns read as a crest; board-2 was a faceless dead-stick ram and was
rejected as ugly. Both archived (`superseded-board1-*`, `superseded-board2-*`)
and neither may be uploaded to Meshy.

Do not overwrite valley `source-root` — that is a different animal (wet bark, a
face, amber sap, the Headwater end). This one is a carved heartwood idol: two
violet eyes, pale-gold horns, blue-green blackwood.

- Prepared: 2026-08-24
- Identity: 古林之心终局首领 / **荆心守卫** (`thorn-heart-warden`)
- Runtime id already existed and the Chinese name is already displayed, so no
  naming step was needed
- Runtime GLB: `public/assets/quality-3d/models/thornheart-warden-runtime-v1.glb`
  (the file is named without the hyphen in `thorn-heart`; the *state* id keeps it)
- Processing script: `scripts/blender/process_thornheart_warden_meshy.py`
- Blender file: `art-source/gloamwood-boss/thornheart-warden-runtime-v1.blend`

## Source

Meshy "Animation Walking with Skin" export, supplied by the owner. The raw
download is a private file and is deliberately not committed, matching the Shell
and Swarm stage-2 packs; the `.blend` in `art-source/` is what makes the runtime
GLB reproducible.

- Downloaded: 2026-08-24
- Original Meshy filename: `Meshy_AI_model_Animation_Walking_withSkin (12).glb`
- Stored source: not committed (private download, 7,271,052 bytes)
- SHA-256: `1e73a8e5c01e547b86b300d45fd1fefef44e384e63156aab78116575a479e079`
- License selected in Meshy: **not yet recorded.** The owner has not supplied a
  dated model-library card for this job. Same outstanding item as Shell stage 1;
  see `docs/ASSET-LICENSE-REGISTER.md`.

## What the source arrived with, and what the script does about it

| Condition | Measured | Repair |
| --- | --- | --- |
| **Neck craters during Walk** (owner-reported twice) | crater is fully open at Walk **frame 0** with head rotation at exactly zero; no-animation is clean; every authored clip is clean | **discard the Meshy Walk and author one.** Damping head/headend/chest/Hips changes nothing at any factor |
| `Hips` carries a constant uniform 0.841 scale key | max scale deviation 0.159 | strip all scale curves → 0.000 |
| Whole body emissive (`emissiveFactor [1,1,1]` over the base colour) | every pixel self-illuminated | rebuild the mask from violet excess, ramp 0.20–0.50 → 8.2% lit, 6.9% weighted |
| Only one clip in the export | `Armature\|Unreal Take\|baselayer` | discarded; Walk, Idle, Slam, Charge, RingBurst, Hit and Death are all authored here |
| No Icosphere this time | — | the deletion guard stays anyway |

Triangles 18,818 in, 18,817 out — inside budget, so no decimation ran. glTF
validator: 0 errors, 0 warnings. 3.27 MB after texture optimisation at 1024px.

## The neck, and why the Swarm form's cure did not transfer

Both forms were reported with the same words - the neck sinks while walking -
and the first attempt here reused the Swarm fix: damp `head` and `headend`
rotation. It did nothing, and the owner reported the dent a second time.

Rendered rather than argued:

| | Swarm stage-2 (`lantern-lynx`) | Gloamwood boss |
| --- | --- | --- |
| No animation | clean | clean |
| Clip frame 0 | clean | **already cratered** |
| Put the head rotation back | **the sink returns** | no change |
| Damping factor 1.0 → 0.0 | fixes it | no change at any value |

Frame 0 is where damping has the least effect of anywhere in a clip, so a fault
that is already fully present there cannot be an amplitude fault. On the Swarm
form the neck is long, soft and unarmoured and head rotation really does shape
it; here the neck is short and under rigid plates, and the fault is in how
Meshy's Walk poses the rig, not in how far it poses it.

Also ruled out, each by rendering: clearing the leg and Hips weight bleed off
the neck vertices (opens a larger hole), smoothing vertex weights globally or
locally (tears the mesh), rebinding with automatic or envelope weights
(destroys the model), and non-normalised or multi-set skin weights (the export
has one influence set summing to exactly 1.0 everywhere).

What did work: **the crater tracks which clip is playing.** Every clip authored
in the processing script is clean at every frame; only the imported Meshy Walk
craters. So the Walk is authored too, at the source clip's own 24-frame cadence,
and the import is discarded.

`scripts/blender/inspect_clip_deformation.py` is the comparison that settled it
and should be run before any future deformation fix is attempted.

## Measured body

- w/h **1.079**, l/h **1.406**
- at `worldHeight` 3.2: **3.45 wide × 4.50 long × 3.20 tall**
- against the largest player form (Shell stage 2, 2.70 × 5.05 × 2.55): 28%
  wider, 25% taller, 11% shorter

l/h 1.406 is over the 1.30 written into the contract before the mesh existed.
That gate was re-derived rather than enforced — see the contract's own note on
why, and on what the lock ring actually requires.

---

## Stage 1 — concept board

Four **separate** images, never collaged. Save into
`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/`:

| # | Role | Filename |
| --- | --- | --- |
| 1 | Primary — 3/4 standing | `gloamwood-thorn-warden-three-quarter.png` |
| 2 | True side (**proportion gate**: length ≈ 1.1 × height) | `gloamwood-thorn-warden-side.png` |
| 3 | Front (**facing gate**: face + gold horns) | `gloamwood-thorn-warden-front.png` |
| 4 | Top — nearly round; plates and crown facing | `gloamwood-thorn-warden-top.png` |

Board-1 rejected 2026-08-24 (archived `superseded-board1-*`): amber thorns
swept up and back like a mane.

Board-2 rejected 2026-08-24 (archived `superseded-board2-*`): faceless dead
thornwood ram. Facing was readable; the look was ugly. Appeal is a gate.

Board-3 self-check (2026-08-24, before owner review): mask-like wooden face
with two large glowing violet eyes is the focal point. Four or five thick
pale-gold thorns curve forward and slightly down like charging-bull horns. One
large glowing violet heart in the chest, same violet in the plate seams. Squat
boulder / giant toad, length about 1.1 × height, four short thick planted
legs. Smooth carved blue-green blackwood, six or seven large rounded plates.
Cool imposing statue, not a pile of sticks.

### Canonical body description (English — paste as the image prompt)

The owner's paste is complete. Prepend the per-view line, then this block.

```
Stylized cartoon creature for a fantasy action game, hand-painted game-art look, neutral grey background, one complete creature, full body, no text, no extra views, no collage.

A huge four-legged forest guardian carved out of living heartwood — the boss that ends the forest. It must look COOL and IMPOSING, the kind of monster a player screenshots. Never rotten, never gory, never a pile of dead sticks.

IT HAS A FACE, and the face is the focal point of the whole design. A broad mask-like wooden head, low and thrust forward, with TWO LARGE GLOWING VIOLET EYES that read from far away. Calm, ancient, unblinking — a carved idol that woke up. Below the eyes, a heavy blunt jaw of smooth wood.

From the brow sweeps a CROWN OF FOUR OR FIVE THICK POLISHED PALE-GOLD THORNS, curving FORWARD and slightly down like the horns of a charging bull. Smooth, clean, big simple curves — never spiky brambles, never thin spears. The crown tells the player instantly which way it faces.

Set in the centre of its chest is ONE LARGE GLOWING VIOLET HEART, a smooth gem of light held in the wood. The same violet light glows faintly in the deep seams between its plates.

PROPORTIONS: shaped like a BOULDER or a giant TOAD — squat, bunched, nearly round seen from above. Body length barely more than shoulder height, about 1.1 times. Four short thick planted legs with broad blunt feet. Hunched shoulders higher than the hips. NOT an elongated animal — never an armadillo, anteater, pangolin, bear, ox or rhino.

SURFACE: smooth carved wood in big bold masses, like a statue. About six or seven large rounded plates laid over the shoulders and back, each broad and simple, separated by deep clean seams. LOW-POLY TOON GAME ASSET — chunky forms, flat broad planes, almost no fine detail.

Colour: deep blue-green blackwood body, warm pale-gold thorns, bright violet glow in the eyes, the chest heart and the seams. Bold, clean, high contrast — the violet and gold must pop off the dark body.

NOT photorealistic. NO tangle or lattice of thin branches. NO twigs. NO bark grain, NO scale texture. NO small spikes scattered over the body. NO moss, NO leaves, NO flowers. NO stone, NO rock, NO granite plates. NO red glow, NO wounds, NO exposed organs, NO gore. NO brown. NO single eye. NO humanoid torso, NO biped. NO long tail. NO multiple creatures, NO turnaround sheet.
```

### Per-view opening lines

| # | Prepend |
| --- | --- |
| 1 | `Three-quarter view from slightly above, front-left, standing at rest.` |
| 2 | `Strict side view, perfectly orthographic, full body, squat boulder/toad, length about 1.1 times shoulder height.` |
| 3 | `Strict front view, perfectly orthographic, very broad, two large glowing violet eyes facing the camera, pale-gold thorns curving forward and slightly down.` |
| 4 | `Strict top-down view looking straight down, nearly round, six or seven large rounded plates, crown showing facing.` |

### Chinese copy (project translation — paste only if the UI is Chinese)

```
风格化卡通幻想动作游戏生物，手绘游戏美术，中性灰背景，画面中只有一只完整全身生物，无文字、无多视图拼接。

一只巨大的四足林地守卫，从活心木里雕出来——结束整片林子的首领。必须又酷又有压迫感，玩家会截图的那种。绝不能腐朽、不能血腥、不能是一堆枯枝。

它有一张脸，脸是整个设计的焦点。宽阔的面具式木头头，低而向前伸，两只巨大发光的紫眼睛，远距离必须读得出来。平静、古老、不眨眼——一尊醒过来的木偶像。眼睛下方是沉重钝厚的光滑木颚。

额上扫出四到五根粗、抛光的浅金棘，向前并略向下弯，像冲锋的牛角。光滑、干净、大而简单的弧——绝不能是细刺荆棘，绝不能是细矛。棘冠立刻告诉玩家它朝哪。

胸口正中嵌着一颗巨大发光的紫心，木头里托着的光宝石。同样的紫光在甲片深缝里微微亮着。

比例：像一块巨石或一只巨蟾——矮、团、从上往下几乎是圆的。身长只比肩高稍长，大约 1.1 倍。四条短粗、扎地的腿，宽钝的脚。弓肩高于臀。不是拉长的动物——绝不要犰狳、食蚁兽、穿山甲、熊、牛或犀牛。

表面：光滑雕木，大块造形，像雕像。肩和背上大约六到七块巨大圆润的甲片，每块又宽又简单，深而干净的缝分开。低面数卡通游戏资产——块状形体、宽平面，几乎没有细部。

颜色：深蓝绿乌木身体，暖浅金棘，眼睛、胸口的心和缝里都是明亮紫光。大胆、干净、高对比——紫和金必须从暗身体上跳出来。

不要写实。不要细枝缠结。不要细枝。不要树皮纹、不要鳞纹。不要满身小刺。不要苔藓、叶子、花。不要石头、岩石、花岗岩板。不要红光、伤口、外露器官、血腥。不要棕色。不要单眼。不要人形躯干、不要两足。不要长尾。不要多只生物、不要多视图拼板。
```

---

## Three self-checks before generating the other three views

1. **Is it a boulder / giant toad?** Length about 1.1 × height. Nearly round
   from above. If it is a long animal, it failed.
2. **Is the face the focal point?** Two large glowing violet eyes on a mask-like
   wooden head. Four or five thick pale-gold thorns curve forward and slightly
   down like charging-bull horns. A faceless ram is board-2.
3. **Is it a cool carved statue?** Deep blue-green blackwood, violet heart and
   seams, gold crown. No dead sticks, no moss, no brown, no red, no gore.

---

## Stage 2 — Meshy upload order

| Order | Role | File |
| --- | --- | --- |
| 1 | **Primary reconstruction image** | `gloamwood-thorn-warden-three-quarter.png` |
| 2 | Extra view — true side | `gloamwood-thorn-warden-side.png` |
| 3 | Extra view — front | `gloamwood-thorn-warden-front.png` |

Do **not** upload: any `valley-source-root-*` image, `evo-dir-shell.png`, any
player-form board, any combined turnaround, or any `superseded-board*` image.

### Meshy prompt (paste English with image 1)

```
Stylized cartoon creature for a fantasy action game, hand-painted game-art look. A huge four-legged forest guardian carved from living heartwood. Cool, imposing, a screenshot monster. A squat BOULDER / giant TOAD: body length about 1.1 times shoulder height, nearly round from above, hunched shoulders higher than hips. Four short thick planted legs, broad blunt feet. IT HAS A FACE: broad mask-like wooden head, low and thrust forward, TWO LARGE GLOWING VIOLET EYES, heavy blunt wooden jaw, calm unblinking carved idol. CROWN OF FOUR OR FIVE THICK POLISHED PALE-GOLD THORNS curving FORWARD and slightly down like charging-bull horns — smooth big simple curves, never thin spears. ONE LARGE GLOWING VIOLET HEART in the chest, same violet glow in deep seams between about six or seven large rounded back plates. Deep blue-green blackwood body. LOW-POLY TOON: chunky forms, flat broad planes, almost no fine detail. Neutral grey background, one complete standing creature, no extra views or text.

Not rotten, not gory, not a pile of dead sticks. Not an armadillo, anteater, pangolin, bear, ox or rhino. No twigs, no bark grain, no moss, no leaves, no stone, no red glow, no brown, no single eye, no humanoid torso, no biped, no long tail.
```

## Reject immediately

| Failure | Why |
| --- | --- |
| Ugly / not screenshot-worthy | Board-2 lesson. Appeal is a gate. |
| Long lean body | Boulder / toad. Length ≈ 1.1 × height. |
| No face, or one eye | The face is the focal point. Two large violet eyes. |
| Thorns sweep up or back over the shoulders | Board-1 failure. They curve forward like a bull. |
| Thin spiky brambles instead of thick polished horns | Unreadable at game size; looks like dead sticks. |
| No violet chest heart | The heart is the spore-ring tell. |
| Red glow, wounds, gore | Owner banned it. |
| Brown dead thornwood, moss, twigs | Board-1 / board-2 look. Carved heartwood statue. |
| Looks like 谷源母根 (amber sap, wet moss, river face) | Wrong map, wrong boss. |
| Looks like 磐岳甲龙 (grey basalt, teal hide) | Wrong family. |
| Biped or rearing rest pose | Cannot sell a quadruped gait or a slam wind-up from standing. |

## Documented Meshy settings

1. **Image to 3D**, not Text to 3D.
2. **High Detail.**
3. Extra views: side then front.
4. Download the **textured GLB**.
5. Export type **Animation → Walking (with skin)** if available — needed for
   the 27-bone quadruped template.

## After the GLB lands

Every pattern's reach must still clear the collision floor
(`playerCombatBodyRadius + 1.72 + 0.22`). Do not author a slam that cannot
connect. Measure `l/h` and `w/h` before Blender.
