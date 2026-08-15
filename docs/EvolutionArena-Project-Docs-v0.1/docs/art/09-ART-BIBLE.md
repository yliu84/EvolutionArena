# Art Bible — v0.1

## Direction

**Stylized 2.5D evolutionary creature combat.**

Selected Gloamwood master reference: `concepts/gloamwood-dark-readable-master-v1.png`.

Approved ground, elevation, river/banks, tree and landmark layers: `../../../../public/assets/map-lab-v2/gloamwood-ground-v1.png`, `../../../../public/assets/map-lab-v2/gloamwood-elevation-v1.png`, `../../../../public/assets/map-lab-v2/gloamwood-riverbanks-v1.png`, `../../../../public/assets/map-lab-v2/gloamwood-trees-v1.png` and `../../../../public/assets/map-lab-v2/gloamwood-landmarks-v1.png`. Current fog/light candidate: `../../../../public/assets/map-lab-v2/gloamwood-atmosphere-v1.png`. All six are exposed at `?maplab=2` with `1–6` comparison controls. Visual approval does not approve collision, navigation, final sprites/y-sort, dynamic atmosphere or live gameplay integration.

The first live readability slice is exposed at `?huntlab=1&debug=1`. It reuses the sixth-layer composite under the authoritative player, monster AI, targeting, combat, fog, drops and evolution systems. This approves an integration direction only: baked trees and cliffs still require independent anchored assets, y-sort/occlusion and collision before the forest can replace the production hunt map.

The slice now contains a first production-style prop pass: two transparent tree types across four data-defined placements. Each uses a bottom-center anchor, y-derived depth, a trunk-only static collision body and proximity fading while the player is behind the canopy. This validates the prop pipeline, not final density; remaining baked trees and all cliff/water/ruin boundaries still need authored gameplay geometry.

The 1672×941 composite is no longer an approved production-map scale because it holds only about 1.3 desktop views and makes ordinary trees dominate combat visibility. The approved spatial prototype is `?maplab=3&debug=1`: 3600×2200, four large clearings, five routes at least 300 units wide, and main combat spaces with a 980–1000 minimum short axis. Repaint the environment on this topology; do not stretch the old raster or shrink the player to make the old composition fit.

V3 ground pass: `../../../../public/assets/map-lab-v3/gloamwood-spacious-ground-v1.png` is the first production-scale painted layer. It is a 1605×980 source displayed at 3600×2200 and can be compared with the geometry skeleton using `G`. Approving this layer approves only moss/soil/leaf materials, broad-route readability, river flow, crossings and edge-ground values. It does not approve collision, elevation, props, fog or combat integration.

V4 exploration topology at `?maplab=4&debug=1` expands the run-scale world to 7200×4400 with four safe spawns, eight lineage nests and one boss lair. It is a pacing diagram, not an art target. The V3 painted ground remains the material/camera reference; future production art should be authored as several cullable sectors rather than one 7200×4400 raster.

The approved blend is an original dark-gothic forest atmosphere with highly readable stylized strategy-game composition. The reference fixes the three-quarter orthographic camera, upper-left key light, down-right cast shadows, visible trunks and cliff faces, deliberate combat clearings, and restrained amber interaction accents. It is a visual target, not a final full-map texture.

Desired qualities:
- colorful but not toy-like;
- strong silhouettes at gameplay zoom;
- mutations readable instantly;
- slightly exaggerated anatomy;
- cohesive materials;
- satisfying transformation VFX;
- browser-friendly complexity.

## Visual Hierarchy

At a glance the player must distinguish:
1. self;
2. safe prey;
3. dangerous hunter;
4. elite;
5. boss;
6. pickups/hazards.

## Environment Layer Rule

Rebuild the forest in a new Map Lab V2. The previous texture-splat ground and procedural billboard trees remain technical references only and must not be integrated into the live hunt map.

Approve one layer at a time:

1. base ground composition, including a painted river corridor placeholder but no bank collision or crossings;
2. elevation and cliff faces;
3. river, banks and crossings;
4. trees split into shadow, trunk and canopy layers;
5. rocks, ruins and small props;
6. fog, lighting and environmental VFX;
7. live combat readability and performance.

All prop images use the same camera, scale and light. Trees require visible trunks, canopy volume, ground contact and bottom-center anchors. Do not use the generated master as a single collision-bearing background image.

## Creature System

The approved first production-quality pipeline is the true-3D coral-gecko vertical slice documented in `19-CHARACTER-QUALITY-BASELINE.md`. It uses a browser-optimized GLB under the fixed 2.5D orthographic gameplay camera. Do not confuse 2.5D presentation with flat billboard art: creatures may be real 3D models while camera, navigation and combat remain deliberately constrained.

Use compatible rig contracts where anatomy genuinely matches, but do not force every evolution stage onto one body. Mutations may attach to controlled slots:
- head;
- back;
- tail;
- skin;
- VFX.

Avoid uncontrolled AI-generated topology combinations.

## AI-Assisted Art Pipeline

1. Define/reference style sheet.
2. Generate concept explorations.
3. Approve silhouette.
4. Produce clean orthographic/reference views if creating 3D assets.
5. Generate/model base asset.
6. Retopology/cleanup as needed.
7. Rig/animate with a reusable rig where possible.
8. Export/import.
9. Validate at actual gameplay camera distance.
10. Optimize and document source/license.

AI output is a draft asset, not automatically production-ready.

## Required Base Animation Set

For a later animated creature pipeline:
- Idle
- Move/Run
- Primary Attack
- Ability
- Hit
- Consume
- Death

Evolution can initially use VFX, scale/material transitions and modular attachments instead of unique transformation animation.

## Mutation Readability

A mutation passes art review if a tester can identify its broad capability from silhouette/VFX after seeing it in action.

Examples:
- Carapace → obvious shell/plates
- Venom → tail/gland + toxic VFX
- Wing → elongated legs/wings and speed trails
- Swarm → visible brood/colony attachments
- Rift → unstable energy chamber and spatial pulse

The legacy hunt map still contains generated 2D/2.5D sprites, canvas-painted modules and billboard props. New production creature work follows the accepted GLB pipeline one asset at a time; large batches remain blocked until the coral gecko passes the pending weight/material gate.

## AI/Asset Licensing

For every externally generated or purchased asset, retain:
- source/service;
- creation/download date;
- license/plan;
- prompt/reference where relevant;
- original file;
- modified production file.

Do not deliberately imitate a living artist or recognizable protected franchise style.
