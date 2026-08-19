# Valley Fang Prey Production Model Contract V1 — 浅滩裂牙

Status: **source accepted and processed to runtime on 2026-08-18.** Silhouette gates all pass. Not yet wired into the game - MapLab 5 has no modelled-prey path, so the runtime GLB is held in `art-source/` rather than shipped: `public/` is what players download, and nothing reaches them that nothing fetches.

Standard: `evolution-arena-creature-production-v2.1`.

Canonical production target (primary Meshy image, 3/4):

`docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-ford-fang-meshy-source-three-quarter.png`

Extra reconstruction views. Use only as dedicated extra-view slots, never collaged into the primary image:

- `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-ford-fang-meshy-source-side-right.png`
- `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/valley-ford-fang-meshy-source-side-left.png` (horizontal mirror of the right profile)

Meshy job pack: `source/SOURCE.md`

Names: `ford-fang` / **浅滩裂牙**. The Chinese name is provisional until the user confirms it for runtime strings.

## Why this form exists

MapLab 5 Fang prey is still a code-built hunter, not a river animal. Valley shallows need a bite-first silhouette that is not the player's gecko and not 溯流刀甲.

This is an **optional** unique prey model. Valley spec still allows reusing the three family bodies. Shipping this body is a cost choice, not a requirement to also replace Shell and Swarm the same week.

## Gameplay identity

Fang prey: fast, short telegraph, commits to a bite. The long snout must make that read. Do not give this body a frontal shield or a spore sac.

## Non-negotiable silhouette

- Quadruped. Four planted feet. Not a biped.
- Long narrow pike/gharial snout with visible teeth. The bite is the identity.
- Dorsal scute row from nape to tail base. Thick tapering tail, shorter than a whip, longer than a stump.
- Olive-green hide, cream belly, teal bands, amber eye. No coral crown, no stone plates, no cyan sac.

## Attack silhouette

Ordinary Fang prey strike, not a player combo and not a new hit-shape. The authored contact pose is a forward bite along the snout axis. Do not stretch the forelimbs into a claw swipe this anatomy cannot sell.

## Acceptance sequence

1. Image-to-3D from the 3/4 target. **Text-to-3D is not permitted.**
2. Silhouette review: long snout, four legs, scute row, olive/cream/teal, not gecko, not pangolin, not crab.
3. Later: decimation, rig, clips, runtime as valley Fang prey only. Do not overwrite player Fang GLBs.

## Generation attempts

| # | Date | Method | Outcome |
| --- | --- | --- | --- |
| 1 | 2026-08-18 | Meshy image-to-3D from the 3/4 target, official Walking rig | **Accepted.** All six silhouette gates pass. Source carries the Icosphere helper, a 0.01 armature scale and one baked `Unreal Take` instead of a clip set. Processed by `scripts/blender/process_ford_fang_meshy.py` to `art-source/quality-3d-models/ford-fang-runtime-v1.glb`: 230,859 → 13,992 triangles, 2048² map → 1024², 5 authored clips, 2.5 MB. |
