# Valley Passive Grazer Production Model Contract V1 — 阶地岩羚

Status: **source accepted and processed to runtime on 2026-08-18.** Silhouette gates all pass. Not yet wired into the game - the valley has no creature runtime, so the runtime GLB is held in `art-source/` rather than shipped: `public/` is what players download, and nothing reaches them that nothing fetches.

Standard: `evolution-arena-creature-production-v2.1`.

Canonical production target (primary Meshy image, 3/4):

`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-terrace-grazer-concept.png`

Names: `terrace-grazer` / **阶地岩羚**.

## Why this form exists

The valley places eighteen passive creatures, more than any other tier, and
until now they all wore the beetle. A beetle in a shell reads as armoured, and
armoured reads as something the player may have to fight. This animal reads as
harmless on sight - hooves, short backswept horns, a calm amber eye - and that
is the whole tier working: the player decides whether to bother, and a decision
needs a silhouette it can be made from.

Two passive bodies distributed differently per region is the same principle that
made the three regions read as three places: the same kit, spread unevenly.

## Gameplay identity

**Passive.** It does not start a fight, and it does not flee - it stands on the
bank and eats, and the player walks past or does not.

It still has an attack. Passive means it does not start one, not that it cannot
finish one: struck, it wakes through the ordinary aggro authority and defends
itself with its horns. There is no third hit-shape and no ranged behaviour.

## Non-negotiable silhouette

- Quadruped on **hooves**, not paws and not root feet.
- Short backswept horns. Not antlers, not a single horn.
- A crest mane along the neck and shoulders, and a tufted tail.
- Sandstone tan with soft brown banding. No moss, no bark, no stone plates.
- A calm eye, set forward. Nothing about the head may read as a predator's.

It must not read as 谷源母根 (bark and root), 崖壁石喉 (ochre stone mass), or
浅滩裂牙 (long snout, dorsal scutes).

## Runtime facts as built

| | |
| --- | --- |
| Triangles | 17,923 → **14,000** (prey budget) |
| Texture | 2048² → 1024² |
| Body radius | **1.02**, the Fang family's - it takes the Fang body, so it carries no frontal damage rule |
| Runtime size | 0.58 × 2.04 × 1.05 |
| Bones | 27, semantic quadruped names, identical to 浅滩裂牙's |
| Clips | Idle (grazing), Walk, Butt, Hit, Death |

The idle grazes. Eighteen of these stand on the banks and it is the animation
the player sees most often in the valley; a grazer standing to attention is the
tell that the map is a shooting gallery with scenery.

## Generation attempts

| # | Date | Method | Outcome |
| --- | --- | --- | --- |
| 1 | 2026-08-18 | Meshy image-to-3D, semantic quadruped rig, one baked take | **Accepted.** All silhouette gates pass. Source carried the usual `Icosphere` helper and a 0.01 armature scale. Processed by `scripts/blender/process_terrace_grazer_meshy.py`. |
