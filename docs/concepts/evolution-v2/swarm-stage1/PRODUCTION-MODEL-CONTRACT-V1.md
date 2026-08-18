# Swarm Stage-1 Production Model Contract V1

Status: **design direction accepted by the user on 2026-08-17** (concept B, flank-sac stalker). No source GLB yet. Do not start Blender, retopology or rigging until the Meshy mesh passes the silhouette gates below.

Standard: `evolution-arena-creature-production-v2.1`. Where this document and typed runtime code disagree, stop and reconcile before producing another creature.

Canonical production target (primary Meshy image, 3/4):

`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/swarm-stage1-concept-b-flank-sac-three-quarter.png`

Extra reconstruction views (side, then front). Use only as dedicated extra-view slots, never collaged into the primary image:

- `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/swarm-stage1-concept-b-flank-sac-side.png`
- `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/swarm-stage1-concept-b-flank-sac-front.png`

Meshy job pack (upload order, prompt, reject list, drop path for the source GLB): `source/SOURCE.md`

Rejected siblings (do not upload):

- `swarm-stage1-concept-a-whippet-gecko.png`
- `swarm-stage1-concept-c-ventral-host.png`
- Any filename containing `superseded-long-tail` (first B: long whip tail, low belly sac, spindly legs)
- The evolution-choice atmosphere still `evo-dir-swarm.png` (bipedal, floating orbs, fog — not a model sheet)

Names: `brood-stalker` / **荧囊猎蜥**. The Chinese name is provisional until the user confirms it for runtime strings.

## Why this form exists

Fang stage 1 and Shell stage 1 are already different animals. Swarm is the last of the three first-evolution routes still borrowing another body. This form must prove the Swarm route is *light, high, and symbiotic*, not a teal recolour of the gecko and not a glowing Shell.

`PROJECT_CONTEXT.md` states evolution must change body plan, silhouette, colour, scale and fantasy. Standard §4 states a recolour, scale change or alternate crown is not a new species. Those two lines are this contract's pass condition.

## Gameplay identity

Player Swarm evolutions change sustain and tempo, not armour:

| Candidate | Authority change |
| --- | --- |
| 共生幼巢 | kill heal 7, biomass +18%, damage −6% |
| 猎行菌群 | speed +14%, biomass +12%, health −10 |

The body must read as **tall, light, and fragile**. A low wide mound would promise Shell. A coral-red raptor would promise Fang. Floating spore orbs would promise a swarm of extra creatures the runtime will never spawn.

Player decision this form changes: it trades raw damage or health for recovery and tempo, and it is the route that wants to keep moving. Long hind legs must be able to sell a leap.

## Non-negotiable silhouette

- Quadruped. All four feet planted. Not a biped, not a theropod standing on two legs with idle forelimbs.
- **Compact: tall on its legs, short torso, short tail.** Tail is held low and straight and is no longer than the shoulder-to-hip distance. A long whip tail was the first B and is rejected.
- Hind legs longer and more powerful than the forelimbs, with visible thigh muscle and a sturdy ankle. Legs are slender but solid, not spindly sticks. Forelimbs stay load-bearing; they are not arms.
- **The large oval cyan spore sac sits high on the upper flank, just below the spine ridge.** It must be readable from the gameplay camera (~36° pitch looking down). A belly sac disappears under the body. The sac glows through the skin and is fused into the torso — not a backpack, not a detached orb.
- A line of small cyan speckles runs along the spine from the shoulders to the tail base.
- Small pointed head, narrow biting jaw, one readable cyan eye (two from the front). Short neck. A short row of small soft spines on the nape only.
- Narrow chest. One single connected creature. No floating orbs, no rider, no armour plates, no separate broodlings.

## Surface and material language

- Near-black teal hide, matte sheen, cyan eye, cyan flank sac as the brightest point.
- Value separation: dark hide against the cyan sac must hold at gameplay distance. Hue-only dots on a mid-grey body will vanish.
- Semi-matte, zero metalness. The sac may carry a *low* measured emissive. Do not reuse the whole base-colour map as full-strength emissive (standard rule 11) — that is how Fang stage 1 went watercolour and how Shell got flattened.
- Palette must not drift toward coral-red / cream Fang, and must not grow grey basalt plates. Those belong to the other two stage-1 bodies.

## Weight and solidity

This form is the *light* end of the three routes. Light is not the same as flimsy.

- Long legs must be separate volumes with planted feet. Painted-on sticks cannot carry a gait or footstep dust (standard rule 3).
- The sac is a volume in the flank, not a flat decal.
- Cadence should be the *lightest* of the three stage-1 forms: faster step rate than Fang, much faster than Shell, shallower plant compression. Dust still emits from discrete plants, never from velocity (standard rule 6).
- None of this may alter authoritative damage, range, targeting or collision (standard rule 10).

## Readable size at the gameplay camera

Same camera as the accepted forms: 44° FOV, ~20.09 follow distance, ~36° pitch. A stage-1 body at 2.16 world height occupies about **13.3% of screen height**.

Consequences:

- Outer contour (tall legs, short body, short tail, dorsal flank sac) is the quality budget.
- Internal sac cells, micro-scales and neck-spine count are not resolvable at ~144 px on 1080p and must not absorb production time.

## Scale and world footprint

Stage-1 default world height is **2.16**. This body is the opposite risk from Shell: Shell was low and long, so height-normalising inflated length. Swarm is tall and short, so height-normalising by the ear-tips can shrink the torso until the sac disappears.

After the source GLB lands, measure width × length × height in Blender and convert at 2.16. If the torso reads as a speck under the camera, the admissible correction is a **form-specific world height** recorded here — never a silent change to collision or attack range. Do not invent that number before the mesh exists.

Typed overrides, if needed, go in `GLOAMWOOD_3D_FORM_WORLD_HEIGHTS` and `GLOAMWOOD_PLAYER_FAMILY_COLLISION_PROFILES`, keyed by family, never by stage.

## Rig, budget and deformation

| Item | Contract |
| --- | --- |
| Triangles | Target parity with Fang stage 1 (19,406). Keep the sac as a readable volume; decimate hide first. |
| Bones | Quadruped rig with weighted jaw, four tracked feet and a segmented tail, in the region of the 27-bone stage-1 rig. |
| Clips | `Idle`, `Walk`, `Run`, `Turn`, `Bite`, `Pounce`, `TailSwipe`, `Hit`, `Death` |
| Runtime GLB | `public/assets/quality-3d/models/brood-stalker-rigged-v1.glb` (name locked after the source passes) |
| Validator | `npm run validate:gltf` at zero errors and zero warnings |

The sac must deform with the belly, not slide off as a separate shell. Do not force this body through scarlet-gecko or stone-pangolin weights.

## Locomotion contract

- Lightest stage-1 cadence: faster plants than Fang, authored foot curves at full weight, runtime adds whole-body weight only (standard rule 3).
- Dust from discrete plants (standard rule 6).
- Turn-before-travel is unchanged. A form-specific turn speed may be faster than Fang; it must be typed.

## Attack silhouette gates

The chain is `Bite → Pounce → TailSwipe` on the single primary input. These are ordinary attacks. Skills stay off.

Long hind legs and a compact body *can* sell a leap, which is why this form keeps Pounce instead of inheriting Shell's Slam. Standard rule 4: do not stretch a body into an attack it cannot support, and do not drop an attack the body can support just to copy Shell.

- `Bite`: narrow jaw snap, short reach, fastest step.
- `Pounce`: hind-leg launch, the signature. Shares the existing ground-safe leap/landing envelope. Authority unchanged.
- `TailSwipe`: long thin tail arc. May reuse the 360° spin contract or a shorter whip; record whichever ships.
- Every contact re-checks the live locked target, surface range, and the 8° aim tolerance.

## Acceptance sequence

1. Image-to-3D generation from the production target. **Text-to-3D is not permitted** — Shell attempt 1 proved generic-lizard priors overwrite identity.
2. Silhouette review against this contract before any rigging work: quadruped, compact tall-short proportions, short tail, high upper-flank sac visible from above, four planted feet, solid legs, no orbs, no plates, no coral-red.
3. Staged decimation toward 19,406, preserving the outer contour. Rig, weights, nine clips, validator pass.
4. Runtime integration behind the `(stage, family)` asset key; debug `characterFamilyMatched` must report `true` for `swarm`.
5. Footprint and traversal verification against the map's obstacles, nest clear radius, and Boss arena.
6. Browser verification at desktop and 844×390: full three-step chain, authoritative damage, grounded feet, zero console errors or warnings.
7. User gameplay acceptance. Only then does the identifier move from `candidate` to `master`.

## Generation attempts

| # | Date | Method | Outcome |
| --- | --- | --- | --- |
| — | — | — | None yet. Record every Meshy job here. Attempt count is this branch's second production-cost data point (Shell took 3 source + 2 rig). |

## Related, not in scope here

The evolution-choice card still `evo-dir-swarm.png` is atmosphere art for the route, not a model sheet. Do not send it to Meshy. Updating that card to match this body is a later UI task.
