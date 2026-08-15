# Map Lab V2 asset notes

## `gloamwood-ground-v1.png`

- Purpose: isolated first-layer visual approval for Gloamwood Map Lab V2.
- Created: 2026-08-14 with OpenAI ImageGen, directed and reviewed for this project.
- Visual reference: `docs/EvolutionArena-Project-Docs-v0.1/docs/art/concepts/gloamwood-dark-readable-master-v1.png`.
- Included: painted ground, hunting paths, river corridor, broad elevation footprints.
- Deliberately excluded: trees, rocks, vertical cliffs, ruins, creatures, characters, fog, combat and UI.
- Status: project-bound prototype asset; it is not yet a final gameplay terrain/collision map.

## `gloamwood-elevation-v1.png`

- Purpose: isolated second-layer approval composite for Gloamwood Map Lab V2.
- Created: 2026-08-14 with OpenAI ImageGen, using the approved ground as edit target and the visual master as cliff-volume reference.
- Included: the approved ground composition plus raised plateaus, moss-softened cliff lips and visible vertical cliff faces.
- Deliberately excluded: detailed river banks/crossings, trees, shrubs, loose rocks, ruins, creatures, characters, fog, combat and UI.
- Status: project-bound visual prototype. It demonstrates elevation language; it is not yet a navigation mesh or collision source.

## `gloamwood-riverbanks-v1.png`

- Purpose: isolated third-layer approval composite for Gloamwood Map Lab V2.
- Created: 2026-08-14 with OpenAI ImageGen, using the accepted elevation composite as edit target and the visual master as water-language reference.
- Included: deep/shallow water separation, directional current, wet mud/sand banks and exactly two broad shallow ford crossings.
- Deliberately excluded: bridges, stepping stones, reeds, vegetation, loose rocks, ruins, creatures, characters, fog, combat and UI.
- Status: project-bound visual prototype. Ford positions communicate intended crossings but do not yet define collision or navigation data.

## `gloamwood-trees-v1.png`

- Purpose: isolated fourth-layer approval composite for Gloamwood Map Lab V2.
- Created: 2026-08-14 with OpenAI ImageGen, using the accepted river/banks composite as edit target and the visual master as tree-volume reference.
- Included: restrained edge clusters of broadleaf and conifer trees, each expressed through ground-contact shadow, visible trunk and volumetric canopy.
- Deliberately excluded: bushes, path-crossing roots, fallen logs, loose rocks, ruins, creatures, characters, fog, combat and UI.
- Status: project-bound visual prototype. Tree placement communicates intended density and route framing; final gameplay trees still require separate anchored sprites, y-sort and collision authoring.

## `gloamwood-landmarks-v1.png`

- Purpose: isolated fifth-layer approval composite for Gloamwood Map Lab V2.
- Created: 2026-08-14 with OpenAI ImageGen, using the accepted tree composite as edit target and the visual master as stonework reference.
- Included: one compact broken stone-arch shrine, one split standing-stone landmark and restrained mossy rock clusters at edges/cliff bases.
- Deliberately excluded: new vegetation, bridges, intact buildings, treasure, fire/glow, characters, creatures, fog, combat and UI.
- Status: project-bound visual prototype. Final gameplay props still require separate anchored sprites, collision footprints, y-sort and landmark interaction decisions.

## `gloamwood-atmosphere-v1.png`

- Purpose: isolated sixth-layer approval composite for Gloamwood Map Lab V2.
- Created: 2026-08-14 with OpenAI ImageGen, using the accepted landmark composite as the exact edit target and the visual master as atmosphere reference.
- Included: low-density blue-green mist at river edges, cliff bases and outer edges; cool ambient fill; restrained warm canopy light and amber bounce around the central route and stone arch; subtle edge depth.
- Deliberately excluded: opaque fog-of-war, route-covering haze, heavy bloom, visible light sources, fire, glowing runes, particles, characters, creatures, combat, skill VFX and UI.
- Status: project-bound visual prototype. Final gameplay fog and lighting must become separately controlled overlays/shaders with readability, reduced-motion and performance limits; this composite is not a runtime fog-of-war system.
