# Valley spore toad / 荧孢蟾 source record

Status: **Meshy job pack, awaiting user-supplied GLB.** Do not start Blender
cleanup, retopology or rigging until the download passes the silhouette gates.

- Prepared: 2026-08-24
- Identity: 河谷群生族小怪 / 荧孢蟾 (`spore-toad`)
- Source type: user-run Meshy Image to 3D from the approved 3/4 concept
- Contract: `../PRODUCTION-MODEL-CONTRACT-V1.md`
- Generation service: Meshy web application, generated and supplied by the user
- Downstream runtime (not this step): `public/assets/quality-3d/models/spore-toad-runtime-v1.glb`

Drop the downloaded textured GLB into **this folder**, keep the original Meshy
filename, then fill the fields below. The source GLB is immutable.

- Downloaded:
- Original Meshy filename:
- Stored source:
- SHA-256:
- License selected in Meshy:
- Register row: add to [`docs/ASSET-LICENSE-REGISTER.md`](../../../../ASSET-LICENSE-REGISTER.md) before any build ships it

## Upload order

Single-image job. Only the approved 3/4 concept exists.

| Order | Role | File |
| --- | --- | --- |
| 1 | Primary reconstruction image (3/4 standing) | the approved spore toad concept |

Do not collage a turnaround board: scarlet-hunter already proved a multi-pose
board in a single-image job merges several bodies into one mesh.

## Meshy prompt (paste English)

```
Stylized low-poly toon game character. A small squat toad-like amphibian: wide
low body crouched on four planted legs, dark blue-green damp scaled skin. NO
TAIL. A single connected cluster of glowing cyan translucent eggs covering its
back, like fused luminous berries. Small blunt head, wide soft closed mouth in a
calm smile, two large round glowing cyan eyes with dark rims. Four short stout
legs, each with visible toes, ALL FOUR planted on the ground and clearly
separate - both hind legs visible, not hidden under the body. Matte damp skin,
no metal, no gloss highlights. Neutral grey background, one complete standing
creature, no extra views or text in the image.

EXACTLY FOUR SEPARATE LEGS, both hind legs visible and planted. NOT a lizard,
NOT a gecko, NOT a crab, NOT a pangolin, NOT a turtle. No tail, no back spines,
no long snout, no wings, no pincers, no teeth. The glowing cluster must be ONE
connected mass on the back, not scattered spots and not separate floating eggs.
```

Chinese copy (only if the UI is in Chinese):

```
风格化低面卡通游戏角色。一只矮胖的蟾蜍状两栖类：宽扁低伏的身体，四条腿着地
蹲踞，深蓝绿色湿润鳞皮。没有尾巴。背上覆盖一整团相连的发光青色半透明卵囊，
像融在一起的发光浆果。小而钝的头，宽而柔和的闭嘴微笑，两只大而圆的发光青眼
带深色眼圈。四条粗短腿，脚趾可见，四条全部着地且彼此分开——两条后腿必须看得
见，不能藏在身体下面。哑光湿润皮肤，无金属、无高光。中性灰背景，画面里只有
一只完整站姿生物，不要拼小图或文字。

恰好四条分开的腿，两条后腿可见且着地。不是蜥蜴、不是壁虎、不是螃蟹、不是
穿山甲、不是乌龟。没有尾巴、没有背棘、没有长吻、没有翅膀、没有钳子、没有牙。
发光卵囊必须是背上一整块相连的团，不是散点，也不是分离的悬浮卵。
```

## Documented Meshy UI settings

1. **Image to 3D**, not Text to 3D.
2. **High Detail**.
3. **Single-image reconstruction.**
4. **Download the textured GLB.**
5. **Do not run Meshy Walking / Auto-rig yet.** Silhouette review first.

## Reject immediately

| Failure | Why |
| --- | --- |
| Fewer than four separate planted legs | The verified 27-bone quadruped rig needs four. This is the likeliest failure: the concept is a front view and the wide body hides the hind legs. |
| Any tail | Rule zero. A tailless body is the whole reason this form replaced the rejected lizard. |
| The sac split into scattered spots or floating eggs | The glow is the read at camera distance; speckles vanish in fog. |
| Back spines, long snout, gecko head | Reads as the player. |
| A bright body with a dim sac | Inverted read. The body is dark so the sac carries. |
| Teeth or a snarl | This is the weakest creature in the game; a threatening face makes the player overestimate it. |

## Next step after the GLB lands

1. Put the file here, fill the fields, and add a row to the licence register.
2. **Count the legs first.** Then check: no tail, one connected back sac, dark
   body, calm face, squat and wide.
3. If it fails, keep it as a numbered rejected candidate and rerun. Do not "fix
   it in Blender" to invent a different animal.
4. If it passes, the rest is mine: cleanup, the quadruped rig, scale to the
   Swarm collision radius 0.64, and one line in the body registry. The valley
   then has no primitives left on it.
