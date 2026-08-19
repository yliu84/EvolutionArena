# Valley Spotted Beetle Production Model Contract V1 — 彩石瓢甲

Status: **source accepted and processed to runtime on 2026-08-18.** Silhouette gates all pass. Not yet wired into the game - MapLab 5 has no modelled-prey path, so the runtime GLB is held in `art-source/` rather than shipped: `public/` is what players download, and nothing reaches them that nothing fetches. Typing is still open: the body is sized to the Carapace collision radius because that is physically what it is, which is deliberately not the same as giving it that family's frontal-damage rule.

Standard: `evolution-arena-creature-production-v2.1`.

Canonical production target (primary Meshy image, 3/4):

`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-spotted-fordbug-meshy-source-three-quarter.png`

Extra reconstruction views. Use only as dedicated extra-view slots, never collaged into the primary image:

- `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-spotted-fordbug-meshy-source-side-right.png`
- `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-spotted-fordbug-meshy-source-side-left.png` (horizontal mirror of the right profile)

Meshy job pack: `source/SOURCE.md`

Names: `spotted-fordbug` / **彩石瓢甲**. The Chinese name is provisional until the user confirms it for runtime strings.

## Why this form exists

Valley prey cannot all be bite-first hunters. This is the friendly, high-dome beetle the shallows need: readable spots, four visible legs, no pincers.

It is an **optional** unique prey model. Valley spec still allows reusing the three family bodies. Shipping this body does not require replacing Fang and Swarm the same week.

It must not read as:

- 叠岩甲蜥 (overlapping stone shingles, all-over armour)
- 溯流刀甲 (wide pincer span)
- 浅滩裂牙 (long snout)

## Gameplay identity

Slow, round, easy to pick out in a wave. A body-check / short slam fits the anatomy; a leap and a long bite do not (standard rule 4). Do not invent a fourth hit-shape. Do not give it a frontal-damage rule unless it is later typed as Shell prey.

## Non-negotiable silhouette

- Exactly four planted legs. Six insect legs fail.
- High round ladybug dome with large cream spots and a closed center seam.
- Small dark head under the rim, two large amber eyes, two short thick bulbous antennae.
- No pincers, no open wings, no long tail, no teeth row.

## Attack silhouette

Ordinary prey strike. The contact pose is a short forward body bump along the dome, not a snout bite and not a claw stretch.

## Acceptance sequence

1. Image-to-3D from the 3/4 target. **Text-to-3D is not permitted.**
2. Silhouette review: four legs, spotted dome, thick antennae, closed shell, not crab, not pangolin, not six-leg beetle.
3. Later: decimation, rig, clips, runtime as valley prey only. Do not overwrite player or boss GLBs.

## Generation attempts

| # | Date | Method | Outcome |
| --- | --- | --- | --- |
| 1 | 2026-08-18 | Meshy image-to-3D from the 3/4 target, UniRig auto-rig, no animation | **Accepted.** All four silhouette gates pass; the cleanest source received so far at 20,899 triangles. Bones are unnamed (`Bone_000`…`Bone_044`), so roles are recovered geometrically. Processed by `scripts/blender/process_spotted_fordbug_meshy.py` to `art-source/quality-3d-models/spotted-fordbug-runtime-v1.glb`: 14,000 triangles, three maps (one 4096²) → 1024², 5 authored clips, 4.4 MB. |
