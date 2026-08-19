# Valley Gate-Two Boss Production Model Contract V1 — 崖壁石喉

Status: **source accepted and processed to runtime on 2026-08-18.** All six silhouette gates pass. Not yet wired into the game - the valley has no boss runtime, so the GLB is held in `art-source/` rather than shipped.

Standard: `evolution-arena-creature-production-v2.1`.

Canonical production target (primary Meshy image, 3/4):

`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-cliff-maw-meshy-source-three-quarter.png`

Extra reconstruction views — **not yet authored**. Upload the 3/4 alone until they exist:

- `valley-cliff-maw-meshy-source-side-right.png` (to author)
- `valley-cliff-maw-meshy-source-side-left.png` (horizontal mirror of the right, generated, never drawn separately)

Meshy job pack: `source/SOURCE.md`

Names: `cliff-maw` / **崖壁石喉**.

## Why this form exists

The valley's second gate, at s=950, and the region boss of the gorge. It is the
one creature in the map whose silhouette is architecture rather than animal: the
player should read a piece of the canyon wall standing up.

The two bosses it must not resemble are both already locked. 溯流刀甲 is a river
crustacean with a wide pincer span; 谷源母根 is bark and moss. This one is dry
ochre stone, and none of the three should be identifiable by colour alone.

## Gameplay identity

Two patterns, and they have to be told apart **from the wind-up alone**:

- **Overhead slam**, 1.45s wind-up. The whole mass rears. Slow, huge, avoidable.
- **Shoulder sweep**, 0.62s wind-up. One shoulder plate drops back. Fast, lateral.

The anatomy has to support both without a third hit-shape. That means real
shoulders with visible plate mass, and forelimbs long enough to lift the body -
a creature that cannot rear cannot sell a 1.45-second slam, and the player will
read it as a bug rather than as a tell.

## Non-negotiable silhouette

- Quadruped stone mass. Four planted legs. Not a biped, not a golem torso on legs.
- **A vertical seam down the front that opens as a maw.** This is the name and the identity.
- Heavy overhanging brow with two small amber eyes set well back under it.
- Flat fractured planes, not rounded boulders. It reads as a cliff face because
  it has faces; a lumpy rock reads as 卵石团子 scaled up.
- Ochre / sandstone. No moss sheets, no bark, no pincers, no long snout.

## Attack silhouette

Region boss patterns, not player combo shapes. The authored contact poses are a
two-forelimb overhead drive and a single-shoulder horizontal sweep. Do not
author a charge; the charge belongs to 溯流刀甲 and this body cannot sell it.

## Runtime budget and geometry

- **Triangles: 26,000.** Boss budget, not prey budget. One instance on screen
  against prey packs of three or four, so it may carry more than the 14,000 the
  valley prey are held to and less than the source will arrive at.
- Textures 1024². A 4096 map on any creature is 7MB of payload for something a
  hand's width on screen.
- `modelYaw` is a **required** field in the runtime config, not a constant in
  the loader. Authored facing differs per model and the first modelled boss
  shipped attacking ninety degrees off.
- Proposed world height **3.2**, body radius **2.0**. Both are authority numbers
  and must be checked, not assumed: the runtime pushes the player out to
  `playerCombatBodyRadius + bodyRadius + 0.22`, and **every pattern's reach must
  exceed that floor**. The Thorn Sentinel's ground slam was authored at 3.35
  against a floor of 3.50 and could not connect with anything, ever, for two of
  its three phase-one slots.

## Acceptance sequence

1. Image-to-3D from the 3/4 target. **Text-to-3D is not permitted.**
2. Silhouette review against the gates above.
3. Then decimation, rig, clips, runtime. Not before.

## As built

| | Proposed | Built | Why |
| --- | --- | --- | --- |
| Triangles | 26,000 | **16,983** | Arrived under budget. The first source that needed no decimation at all. |
| Textures | 1024² | 1024² | Base colour and normal kept; the metallic-roughness map was dropped. It was 1.6MB encoding "not metal, somewhat rough" across a creature that is uniformly both, and the faceted silhouette carries the read without it. |
| World height | 3.2 | **3.83** | See below. |
| Body radius | 2.0 | **2.0** | See below. |
| Collision floor | — | **3.78** | `1.56 + 2.0 + 0.22`. Every pattern's reach must exceed this. |

The proposed height and radius were inconsistent with the model that arrived,
which is what the contract asked to be checked. It is 1.05 as long as it is
tall, so a height of 3.2 yields a footprint radius of 1.68 - narrower than the
nest guardian's 1.82, which is wrong for a gate boss, and it would leave the
collision circle wider than the visible body.

The radius was kept, because it is the number collision reads and it has to
exceed the guardian's, and the height was allowed to follow from the model's own
proportions. A piece of canyon wall standing 3.83 next to a 2.55 player is the
intent rather than a compromise.

## Rig

35 bones, UniRig auto-rig, no names and no animation. Roles recovered
geometrically by `scripts/blender/meshy_autorig_quadruped.py`.

This rig has **no neck**. The root sits between the shoulders and the hips, with
one mid-line chain running forward to the front legs and another back to the
rear ones, so the module returns a `spine` and a `hips` and no head bone at all -
the brow slab is skinned to the forward chain.

Two defects were found writing that resolver and are now asserts:

- The "up" axis cannot be found by distance from the root. On a hunched body the
  tail end is further from the root than the ground is, so that test picked
  front-to-back and classified two feet into the same corner.
- The "side" axis is the one the feet **mirror across**, not the one they spread
  furthest along. Those two answers differ here by two and a half percent and
  point at different axes; the spread test swapped left-right with front-back
  and then walked the spine into a foreleg.

## Clips as built

Idle, Walk, Turn, **Slam**, **Sweep**, Hit, Death.

The contract's requirement is that the two patterns are told apart from the
wind-up alone, and that is what shapes them: the slam's wind-up is symmetric -
the whole mass rears, both forelimbs leave the ground - and the sweep's is
one-sided, coiling to the shoulder that will lead. The player reads "it is going
up" against "it is loading one shoulder" and never has to time two things that
look the same.

## Generation attempts

| # | Date | Method | Outcome |
| --- | --- | --- | --- |
| 1 | 2026-08-18 | Meshy image-to-3D from the 3/4 target, UniRig auto-rig, no animation | **Accepted.** All six silhouette gates pass; 16,984 triangles, already inside the boss budget. Source carried the usual `Icosphere` helper. Processed by `scripts/blender/process_cliff_maw_meshy.py`. |
