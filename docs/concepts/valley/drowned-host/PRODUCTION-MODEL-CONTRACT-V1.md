# Valley Drowned Host Production Model Contract V1 — 溺囊

Status: **job pack written, awaiting a user-supplied Meshy GLB.** Nothing generated, nothing rigged, nothing wired.

Standard: `evolution-arena-creature-production-v2.1`.

Canonical production target (primary Meshy image, 3/4):

`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-drowned-host-concept.png`

Extra reconstruction views: **none exist yet.** Ford Fang and Spotted Beetle each got a
strict right profile plus its mirror; this form has only the 3/4. Run it as a
single-image job, or produce the profiles first. Do not collage.

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
