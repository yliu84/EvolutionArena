# Valley Spore Toad Production Model Contract V1 — 荧孢蟾

Status: **concept approved, awaiting a user-supplied Meshy GLB.**

Standard: `evolution-arena-creature-production-v2.1`.
Supersedes: [`drowned-host`](../drowned-host/PRODUCTION-MODEL-CONTRACT-V1.md),
rejected at concept review for reading as the player.

Names: `spore-toad` / **荧孢蟾**. It wears the Swarm family's numbers, whose
display name is 荧孢群虫.

## Why this form exists

It closes the last unmodelled family on the valley map. Every other creature
there is an authored body; the Swarm family had none, so fourteen creatures
stood on the road as code-built primitives - the only geometry blocks left.

## Rule zero: it must not be a four-legged lizard

That silhouette belongs to the player. The Coral Gecko the run starts in and
the Scarlet Gecko the Fang route evolves into are both sprawling quadruped
lizards with a body-length tapering tail, scaled skin, back spines and a blunt
lizard head - and all three stock concepts for this slot were the same animal.
Texture is the first thing to go at the valley's camera distance, and this
family arrives two and three at a time, which would put three copies of the
player's own silhouette around the player.

The break is **no tail**, plus a squat wide body. Nothing else on this map is
tailless except the walking rock.

## Gameplay identity

The weakest creature in the game: 24 health, 6 damage, 2.9 move speed, and the
smallest body on the map at a 0.64 collision radius. Its job is chip damage and
crowding, not a duel, and it arrives inside a pack.

So it is friendly-faced on purpose. The valley's prey standard is already
written - "friendly... no teeth row" - and a snarling face on the weakest thing
on the map makes the player overestimate it, which is a readability failure
before it is an aesthetic one.

The glow is the mechanic's tell as much as the theme's: three of these must be
countable at a glance, in fog, at the valley's camera distance. So the body is
dark and the sac is the only bright thing on it.

## Non-negotiable silhouette

- **No tail.** This is rule zero and it is not negotiable for any reason.
- Exactly four separate legs, all planted, toes visible. **Both hind legs must
  be visible and not fused into the body** - see the generation risk below.
- One **connected** glowing cyan egg cluster covering the back. Scattered
  speckles fail: the glow is the read at camera distance and speckles vanish
  in fog.
- Squat, wide, low. It reads small because it is small.
- Dark blue-green body so the sac carries the contrast.
- Calm rounded face, soft closed mouth, large round glowing eyes. No teeth,
  no snarl.

## Sizing

Authored to the Swarm family's collision radius, **0.64**, as every other valley
body is sized to what blocks the player. It is the smallest creature on the map
and must read as such beside a 1.55 Ford Fang.

## Generation risk recorded before the first attempt

The approved concept is a three-quarter **front** view, and the wide low body
hides the hind legs - only three leg outlines are countable in it. Meshy
reconstructs from the image, so the hind legs may fuse or be dropped, and wrong
leg count is the first rejection reason in this pipeline: the verified 27-bone
quadruped rig needs four.

Run the single image first and **count the legs on the download before anything
else**. If the hind legs fused, produce a side profile and rerun - that is
cheaper than drawing profiles for a job that might not need them, and the
profile gate is what corrected the Spotted Beetle's proportions.

## Next gate

User runs Meshy Image to 3D from the approved concept and drops the textured GLB
into `source/`. Silhouette review against this file comes before any Blender
work.
