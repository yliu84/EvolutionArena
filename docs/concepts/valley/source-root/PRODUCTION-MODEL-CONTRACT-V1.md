# Valley Final Boss Production Model Contract V1 — 谷源母根

Status: **source accepted and processed to runtime on 2026-08-19, with one gate waived.** Not yet wired into the game - the valley has no boss runtime, so the GLB is held in `art-source/`.

Standard: `evolution-arena-creature-production-v2.1`.

Canonical production target (primary Meshy image, 3/4):

`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-source-root-meshy-source-three-quarter.png`

Extra reconstruction views — **not yet authored**. Upload the 3/4 alone until they exist:

- `valley-source-root-meshy-source-side-right.png` (to author)
- `valley-source-root-meshy-source-side-left.png` (horizontal mirror of the right, generated, never drawn separately)

Meshy job pack: `source/SOURCE.md`

Names: `source-root` / **谷源母根**.

## Why this form exists

The headwater's boss and the end of the run. It is the only creature the player
meets after the mutations have stopped arriving, so it is the one fight where
what they built is all they have.

It must not resemble the two bosses before it. 溯流刀甲 is a river crustacean;
崖壁石喉 is dry ochre stone. This one is wet bark, root and moss - the valley's
source, grown into an animal.

## Gameplay identity

Three patterns, one of them phase-two only:

- **Root slam**, both forelimbs, wide and slow.
- **Lunge**, a committed forward drive on the root feet.
- **Ring burst**, phase two only, from the sap knot at the chest.

The chest knot is load-bearing design, not decoration: the ring has to come from
somewhere the player can look at during the wind-up. A ring that erupts from a
featureless torso is a ring with no tell.

## Non-negotiable silhouette

- Quadruped. Four limbs ending in **splayed root feet**, not paws and not hooves.
- Bark plating over the shoulders and flanks, with the grain running along the limbs.
- ~~**A single large amber eye** under a heavy brow ridge. One, not a pair.~~
  **Waived by the producer on 2026-08-19.** The model has a pair. At a camera
  11.8 up and 16.25 back nobody counts eyes, and the root feet, the bark, the
  moss and the low sprawling spread already separate this head from everything
  else in the map - the eye count was the weakest of several redundant
  identifiers. Recorded rather than left implicit: gates are only worth having
  if a failure stays visible afterwards.
- Moss sheeting across the back and hindquarters only. The front stays bare bark.
- A visible amber sap knot at the chest.
- No stone plates, no pincers, no long snout, no spines row.

## Attack silhouette

Region boss patterns. The authored contact poses are a two-limb overhead slam, a
forward lunge along the body axis, and a chest-centred ring. Do not author a
shoulder sweep; that is 崖壁石喉's and the two bosses must not share a tell.

## Runtime budget and geometry

- **Triangles: 26,000.** Boss budget. One instance on screen.
- Textures 1024².
- `modelYaw` is a **required** field in the runtime config.
- Proposed world height **3.6**, body radius **2.2** - the largest creature in
  the valley, which is the point. Both are authority numbers and must be
  checked, not assumed: the runtime pushes the player out to
  `playerCombatBodyRadius + bodyRadius + 0.22`, and **every pattern's reach must
  exceed that floor**. The Thorn Sentinel's ground slam was authored at 3.35
  against a floor of 3.50 and could not connect with anything, ever.
- The ring burst has an inner radius as well as an outer one. Check the inner
  radius against the same floor from the other side: a ring whose safe centre is
  smaller than the closest the player can stand is a ring that always hits.

## Acceptance sequence

1. Image-to-3D from the 3/4 target. **Text-to-3D is not permitted.**
2. Silhouette review against the gates above.
3. Then decimation, rig, clips, runtime. Not before.

## As built

| | Proposed | Built | Why |
| --- | --- | --- | --- |
| Triangles | 26,000 | **25,688** | Arrived inside budget; nothing decimated. |
| Textures | 1024² | 1024² | Metallic-roughness map dropped, as on the Cliff Maw. |
| World height | 3.6 | **2.40** | See below. |
| Body radius | 2.2 | **2.2** | See below. |
| Collision floor | — | **3.98** | `1.56 + 2.2 + 0.22`. Every pattern's reach must exceed this, **and the ring burst's inner radius must too** - a ring whose safe centre is smaller than the closest the player can stand always hits. |
| File | — | 4.6 MB |

The proposed height and radius were inconsistent, the same way the Cliff Maw's
were. This body is 1.83 as long as it is tall, so a height of 3.6 gives a radius
of 3.29 and a floor of 5.07 - and the ring burst's inner radius would then have
to clear 5.07, which is the failure this contract itself names.

The radius was kept. It makes the final boss the **widest** thing in the valley -
4.4 across against the Cliff Maw's 4.0 - and lower. A wall and a spreading mass
are different threats, and covering floor is the right shape for a creature
whose three patterns all do.

## Clips as built

Idle, Walk, Turn, **Slam**, **Lunge**, **RingBurst**, Hit, Death.

The three patterns are told apart by where the mass goes during the wind-up:
the slam sends the front **up**, the lunge gathers **back** and stays low, and
the ring burst compresses **down and inward** over the chest knot - so the tell
for the ring is the creature getting smaller before it gets bigger, with the
knot at the centre of it.

## Rig

23 bones, UniRig auto-rig, no names and no animation. Roles recovered by
`scripts/blender/meshy_autorig_quadruped.py`: a spine, a hips chain, and four
five-bone root limbs. No head bone - the head is skinned to the forward chain.

## Generation attempts

| # | Date | Method | Outcome |
| --- | --- | --- | --- |
| 1 | 2026-08-19 | Meshy image-to-3D from the 3/4 target, UniRig auto-rig, no animation | **Accepted with one gate waived** (single eye). Five of six silhouette gates pass. Processed by `scripts/blender/process_source_root_meshy.py`. |
