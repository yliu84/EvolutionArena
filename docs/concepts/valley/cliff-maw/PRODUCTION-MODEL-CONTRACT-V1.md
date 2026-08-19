# Valley Gate-Two Boss Production Model Contract V1 — 崖壁石喉

Status: **design direction accepted by the user on 2026-08-18.** No source GLB yet. Do not start Blender, retopology or rigging until the Meshy mesh passes the silhouette gates below.

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

## Generation attempts

| # | Date | Method | Outcome |
| --- | --- | --- | --- |
| — | — | — | None yet. |
