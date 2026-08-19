# Valley Scree Grazer Production Model Contract V1 — 卵石团子

Status: **source accepted and processed to runtime on 2026-08-18.** Silhouette gates all pass. Not yet wired into the game - the valley has no creature runtime, so the GLB is held in `art-source/` rather than shipped.

Standard: `evolution-arena-creature-production-v2.1`.

Concept: `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-pebble-dumpling-concept.png`

Names: `pebble-dumpling` / **卵石团子**.

## Why this form exists

The third passive body, and the one that belongs on rock. The valley now gives
each terrain its own harmless silhouette, which is the same principle that made
the three regions read as three places - one kit, spread unevenly:

| Body | Ground |
| --- | --- |
| 彩石瓢甲 | Wet and green: the fern hollow, the reed ford |
| 阶地岩羚 | Grass banks and terraces |
| **卵石团子** | **Scree: the scree shelf, the stone bowl, the bare headwater** |

It carries a second reason the other two do not. The scree branches are dressed
with the same three boulders scaled three to twelve times, so **a creature that
reads as one of them until it moves is free tension**. That needs no mechanic,
only a placement rule: put it among real stones.

## Gameplay identity

Passive. It does not start a fight and it does not flee. Struck, it wakes
through the ordinary aggro authority and shoves - no bite, no claw, no leap. It
is a stone with legs and the contact pose has to say so.

## Non-negotiable silhouette

- A river stone with **four separate stubby legs**. The legs separating is what
  stops it reading as an ordinary prop.
- Moss cap over the top, with small pebbles set into it.
- Pale claw toes and pale banding around the eyes - the only light values on the
  body, and what makes the face findable on a grey mass.
- Worn smooth. It must not read as 崖壁石喉, which is dry fractured sandstone at
  more than twice the size.

## Runtime facts as built

| | |
| --- | --- |
| Triangles | 22,769 → **14,000** (prey budget) |
| Textures | 2048² and 4096² → 1024²; metallic-roughness dropped |
| Body radius | **1.42**, the Carapace family's |
| Runtime size | 2.55 × 2.84 × 1.62 |
| File | 3.8 MB |
| Bones | 17, unnamed auto-rig, roles recovered geometrically |
| Clips | Idle, Walk, Shove, Hit, Death |

The idle barely moves - a slow head turn and nothing else. That is the whole
tension: the player walks past a boulder that was watching them.

## Rig note

All four legs hang off a single trunk vertebra, which is what a round animal
looks like to a solver. `meshy_autorig_quadruped` refused this rig at first,
because it had claimed that vertebra for the legs and left the mid-line chain
with nothing but the root in it. The shared-bone rule exists because of this
body: a bone claimed by more than one leg is a body bone.

## Generation attempts

| # | Date | Method | Outcome |
| --- | --- | --- | --- |
| 1 | 2026-08-18 | Meshy image-to-3D, UniRig auto-rig, no animation | **Accepted.** All silhouette gates pass. Source carried the usual `Icosphere` helper. Processed by `scripts/blender/process_pebble_dumpling_meshy.py`. |
