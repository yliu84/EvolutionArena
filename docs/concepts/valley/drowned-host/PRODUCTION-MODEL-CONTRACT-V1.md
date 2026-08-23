# Valley Drowned Host Production Model Contract V1 — 溺囊

Status: **rejected at concept review. Do not generate this form.**

It reads as the player. The Coral Gecko the run starts in, and the Scarlet
Gecko the Fang route evolves into, are both four-legged sprawling lizards with a
tapering tail about a body long, scaled skin, a row of back spines and a blunt
lizard head. So is this. The only difference is the glowing sac and the colour,
and at the valley's camera distance in fog the texture is the first thing to go
- while this family arrives two and three at a time, which puts three copies of
the player's own silhouette around the player.

The same objection kills the other two stock concepts for this slot: the
Driftwood Mimic and the Reed Otterling are quadruped lizards too.

The check that was missed: the candidate was compared against the other valley
creatures - the olive river hunter, the orange dome beetle, the sandstone
grazer, the walking rock - and never against the player, who is the one thing on
screen at all times.

What survives from this concept is the **glowing brood sac**, which is the
family's identity and the reason it was picked: 荧孢群虫 is a bioluminescent
spore swarm. It needs a body that is not a lizard to sit on. See the silhouette
lock below.

Standard: `evolution-arena-creature-production-v2.1`.

Canonical production target (primary Meshy image, 3/4):

`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-drowned-host-concept.png`

Extra reconstruction views (separate files, never one collage):

- right profile + its horizontal-flip left: lock length, tail ≈ body, sac as one mid-back hump
- front: lock four planted legs and one central cyan eye
- top: lock one connected dorsal sac; optional third extra slot only

Meshy job pack: `source/SOURCE.md`

Meshy job pack: `source/SOURCE.md`

Names: `drowned-host` / **溺囊**.

## Why this form exists

It closes the last gap on the valley map. Every other creature there is an
authored body; the Swarm family has none, so fourteen creatures still stand on
the road as code-built primitives whatever else is loaded. They are the only
geometry blocks left.

It is picked for the Swarm family rather than assigned by taste. The family is
**荧孢群虫** - bioluminescent spore swarm - and this concept carries a glowing
cyan egg-sac cluster on its back. The identity is already in the drawing.

It must not read as:

- 岩甲穿山甲 (the player's Shell stage-1 body, overlapping shingles)
- 浅滩裂牙 (olive hunter, long snout)
- 彩石瓢甲 (orange dome, cream spots)
- 阶地岩羚 / 卵石团子 (sandstone grazers)

## Gameplay identity

The Swarm family in numbers: 24 health, the smallest body on the map at 0.64
radius, 2.9 move speed, 6 damage, and it arrives two at a time inside a pack.
Its job is chip damage and crowding, not a duel.

So the glow is the mechanic's tell as much as the theme's: three of these in a
pack must be countable at a glance, in fog, at the valley's camera distance. The
sac is the read. Everything else about the body is dark.

Do not give it a frontal-damage rule. That belongs to Shell alone, and the
attack circle it already carries is the smallest in the game on purpose.

## Non-negotiable silhouette

**Rule zero, and the one this concept failed: it must not be a four-legged
lizard.** That silhouette belongs to the player, in two of their three forms.
The cheapest break is **no tail** - nothing else on this map is tailless except
the walking rock - and a squat, wide, low body, which also reads as small, which
it is: this is the smallest creature on the map at a 0.64 collision radius.

A tailless amphibian carries all of it: four legs for the verified 27-bone
quadruped rig, no tail, a wide low body, and brood sacs on the back, which is
where the glow belongs and is what a Surinam toad actually looks like. A river
valley is where you would find one.

## Non-negotiable silhouette (superseded — kept for the sac description)

- Exactly four planted legs with visible claws. Six legs fail; it is not an insect.
- A single **glowing cyan sac cluster on the back**,reading as one mass of rounded
  eggs, not scattered speckles. This is the identity.
- Dark blue-green body, low salamander stance, tapering tail about body length.
- Small blunt head, one visible glowing eye colour, low spines along the spine line.
- No wings, no pincers, no rider, no detached floating parts.

## Sizing

Authored at the Swarm family's collision radius, 0.64, exactly as every other
valley body is sized to what blocks the player. It is the smallest creature on
the map and must read as such next to a 1.55 Ford Fang.

## Next gate

User runs Meshy Image to 3D from the 3/4 concept and drops the textured GLB into
`source/`. Silhouette review against this file comes before any Blender work.
