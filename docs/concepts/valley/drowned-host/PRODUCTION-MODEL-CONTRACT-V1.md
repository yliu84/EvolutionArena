# Valley Drowned Host Production Model Contract V1 — 溺囊

Status: **toad revision written, awaiting a user-supplied Meshy GLB.** The first lizard/salamander concept was rejected because it read as the player. Do not upload any `superseded-lizard-*` file.

Standard: `evolution-arena-creature-production-v2.1`.

Canonical production target (primary Meshy image, 3/4 toad):

`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-drowned-host-concept.png`

Same image is also stored as `valley-drowned-host-toad-three-quarter.png`.

Extra reconstruction views (separate files, never one collage):

- right profile + its horizontal-flip left: squat rump, **no tail**, sac covering the back
- front: four short planted legs, wide mouth, sac as one mass
- top: one connected dorsal sac on an oval tailless body; optional third extra slot only

Meshy job pack: `source/SOURCE.md`

Names: `drowned-host` / **溺囊**.

## Why this form exists

It closes the last gap on the valley map. Every other creature there is an
authored body; the Swarm family has none, so those slots still stand as
code-built primitives.

It is picked for the Swarm family because **荧孢群虫** is a bioluminescent spore
swarm, and this body carries a glowing cyan egg-sac over the whole back.

It must not read as:

- the player Coral / Scarlet gecko (four-legged lizard with a tapering tail)
- 岩甲穿山甲 (Shell stage-1, overlapping shingles)
- 浅滩裂牙 (olive hunter, long snout)
- 彩石瓢甲 (orange dome, cream spots)
- 阶地岩羚 / 卵石团子 (sandstone grazers)

## Gameplay identity

The Swarm family in numbers: 24 health, the smallest body on the map at 0.64
radius, 2.9 move speed, 6 damage, and it arrives two at a time inside a pack.
Its job is chip damage and crowding, not a duel.

The glow is the tell: three of these in a pack must be countable at a glance, in
fog, at the valley's camera distance. The sac is the read. The body stays dark.

Do not give it a frontal-damage rule. That belongs to Shell alone.

## Non-negotiable silhouette

- **Not a lizard.** No tail, no back spines, no long snout, not a gecko.
- Squat, fat, wide, flattened toad. Low crouch. Smallest creature on the map.
- Exactly four thick short legs, toes visible, all planted.
- One connected glowing cyan sac covering the back, like fused berries.
- Small round calm head, soft closed mouth, large gentle rounded cyan eyes; no frown or scowl.
- No wings, no pincers, no rider, no detached eggs.

## Sizing

Authored at the Swarm family's collision radius, 0.64. It must read small next
to a 1.55 Ford Fang.

## Next gate

User reviews the toad 3/4 and plan views, then runs Meshy Image to 3D from the
3/4 and drops the textured GLB into `source/`. Silhouette review against this
file comes before any Blender work.
