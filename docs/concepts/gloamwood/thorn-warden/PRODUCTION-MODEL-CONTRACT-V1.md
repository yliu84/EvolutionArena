# Gloamwood Nest Boss Production Model Contract V1 — 荆心守卫

Status: **revision-3 board generated 2026-08-24; awaiting user review of the
3/4.** Board-1 (crest thorns) and board-2 (faceless dead-stick ram, rejected as
ugly) are archived. No source GLB yet. The compact Gloamwood hunt still draws
this boss from primitives. Do not start Blender until the Meshy mesh passes the
gates below.

Standard: `evolution-arena-creature-production-v2.1`.
Job pack: `source/SOURCE.md`.

Names: runtime id **`thorn-heart-warden`**, display name **荆心守卫**. Both
already exist in `src/gloamwood-3d-boss.ts`. Do not invent a second id.

This is **not** 谷源母根 (`source-root`). That is the River Valley Headwater
boss: wet bark, a face, amber sap. This one ends the compact Gloamwood forest
as a carved heartwood idol: two violet eyes, pale-gold horns, blue-green
blackwood.

---

## 1. Why this form exists

`src/gloamwood-3d-modelled-boss.ts` records the current state: the Thorn
Sentinel is around thirty primitives animated by writing positions every frame.
Valley already has three authored bosses. The forest-ending fight is the last
placeholder of that class.

Pass condition: the player must read a **cool imposing statue they have to get
past**, and must tell facing, slam limbs and the chest heart without a
nameplate. Appeal is a gate: a readable ugly ram is still a fail.

## 2. Gameplay identity — the art those patterns force

Typed in `GLOAMWOOD_BOSS`:

| Pattern | Shape | What the body must show |
| --- | --- | --- |
| `root-slam` | circle, radius 4.3 | two thick front limbs that can rear up and slam |
| `thorn-charge` | line, 6.4 × 0.82 | a forward gold crown that reads facing from far away |
| `spore-ring` | ring, inner 2.15 / outer 5.15 | one glowing violet chest heart the ring erupts from |

The face and gold crown are the facing tell. The violet heart is the ring tell.
The front limbs are the slam tell. A featureless thicket with none of those
three is a fight the player cannot read.

Incoming damage has **no facing term** (`damageGloamwoodBoss` is flat). Do not
draw a front shield that promises a rear weak point.

`bodyRadius` is **1.72**. Preferred range 3.82. Collision floor for the widest
player is about 3.50. Every pattern's reach already clears that floor; a
replacement mesh must not shrink the authored slam.

## 3. Non-negotiable silhouette

- Squat boulder / giant toad. Side: **length about 1.1 × height**. Top: nearly
  round. Hunched shoulders higher than the hips. Not a long animal.

  **The delivered mesh measures l/h 1.41, over this.** The gate was re-derived
  rather than enforced, and the reasoning is recorded here so the next body is
  judged against the real constraint instead of this number.

  What the ratio actually protects is the lock ring. `targetRing` is drawn at
  `bodyRadius + 0.08` to `+ 0.22`, flat on the ground, and `bodyRadius` is 1.72
  and cannot move - every pattern's reach derives from it, and lowering
  `preferredRange` to 3.3 once stopped the fight dead. A body whose half-length
  exceeds 1.94 buries the ring under itself at the nose and tail.

  At `worldHeight` 3.2 and l/h 1.41 the half-length is 2.25, so the ring shows
  at the flanks and is hidden fore and aft. That is worse than a full circle and
  **better than what shipped**: the primitive assembly it replaces had a
  half-length of 2.4 against the same radius, so the ring was already partial.
  Nothing else breaks - the player is pushed out to 3.50 from the centre, well
  clear of 2.25, and no telegraph decal is smaller than the body.

  A stricter reading would have cost another board and another Meshy run to buy
  back a ring the game has never drawn whole. The honest gate for the next boss
  is **half-length ≤ 1.94 world units**, or `l/h ≤ 3.88 / worldHeight`.
- Four short thick planted legs, broad blunt feet. Two heavy front limbs,
  planted at rest.
- **It has a face.** Broad mask-like wooden head, low and thrust forward, **two
  large glowing violet eyes**, heavy blunt wooden jaw. Calm carved idol.
- Facing is also a **crown of four or five thick polished pale-gold thorns**
  curving **forward and slightly down** like charging-bull horns — not a crest,
  mane or back fin over the shoulders.
- **One** large glowing violet chest heart. Same violet in the deep plate
  seams. No red.
- **Six or seven large** rounded plates on shoulders and back. Big, simple,
  deep clean seams.
- No long tail. Short stub at most.
- Smooth carved living heartwood in big bold masses. Low-poly toon. No twigs,
  no moss, no bark grain, no brown dead-stick pile.

## 4. Palette

Deep blue-green blackwood, warm pale-gold thorn crown, bright violet in the
eyes, the chest heart and the seams. Bold high contrast. **No brown**, **no
moss-green**, **no crimson**, **no cyan** (Swarm), **no coral-red** (Fang),
**no grey basalt** (Shell).

## 5. Rig, budget and clips

| Item | Contract |
| --- | --- |
| Triangles | 20,000–26,000. Boss budget, one instance. |
| Bones | 27-bone Meshy quadruped template if Walking export is used. |
| Clips | `Idle`, `Walk`, `Hit`, `Death`, plus one clip per pattern: slam, charge, ring |
| Validator | `npm run validate:gltf` at zero errors and zero warnings |
| World height | Follow the finished mesh; do not invent it before silhouette review |

**Delivered against this table:** 18,817 triangles - under the 20,000 floor
because the Meshy export arrived at 18,818 and decimating a mesh already inside
budget would only cost fidelity. The floor was written to stop a boss shipping
at prey density; it is not a reason to reject a source that is simply efficient.
27 bones, seven clips (`Idle`, `Walk`, `Slam`, `Charge`, `RingBurst`, `Hit`,
`Death`), validator at 0 errors / 0 warnings, `worldHeight` 3.2.

## 6. Acceptance sequence

1. Concept board — 3/4, side, front, top, never collaged. **Done** (board 3).
2. Silhouette review against §2 and §3 at the true gameplay camera.
3. Meshy Image-to-3D. Text-to-3D is forbidden.
4. Measure proportions before Blender. Confirm slam reach still clears the
   collision floor.
5. Process, rig, clips, validator pass.
6. Runtime swap: replace the primitive builder, keep `GLOAMWOOD_BOSS` authority
   numbers unless a measured body forces a typed radius change.
7. Browser verification, desktop and 844×390.
8. Owner gameplay acceptance.

## 7. Generation attempts

| # | Date | Method | Outcome |
| --- | --- | --- | --- |
| board-1 | 2026-08-24 | four separate images from the first prompt | **Rejected:** amber thorns swept up and back like a mane. Archived `superseded-board1-*`. |
| board-2 | 2026-08-24 | four separate images from the revised FRONT | **Rejected as ugly.** Faceless dead-thornwood ram. Facing was readable; appeal failed. Archived `superseded-board2-*`. |
| board-3 | 2026-08-24 | four separate images from the owner's idol / heartwood prompt | **Accepted.** Mask face, two violet eyes, pale-gold horns forward, violet chest heart, squat toad / boulder, blue-green blackwood. |
| mesh-1 | 2026-08-24 | Meshy Image-to-3D, Animation Walking with Skin | **Accepted.** 18,818 triangles, 27 bones, w/h 1.079, l/h 1.406. Neck sink and a constant Hips scale key repaired in Blender; six clips authored. |

## 8. Delivered

Shipped 2026-08-24 as `thornheart-warden-runtime-v1.glb`, loading on the
Gloamwood map when the guardian encounter opens. Three patterns, three clips,
measured at the head as a fraction of the rest head-above-forefoot distance:

| Pattern | Clip | Wind-up | Contact |
| --- | --- | --- | --- |
| `root-slam` | `Slam` | −35% then **+76%** (rear onto the haunches) | **−79%** (crash down) |
| `thorn-charge` | `Charge` | −58% → **−85%**, held (crown aimed down the lane) | **+32%** (extend out of the coil) |
| `spore-ring` | `RingBurst` | −61% → **−87%** (deepest tuck in the set) | **+103%** (highest flare, limbs splayed) |

Slam and RingBurst are opposite at the instant of contact; Charge is the only
one that stays low across its whole wind-up. That separation is the reason this
body exists — the primitives drove all three from `body.position.x = strike *
0.65`.
