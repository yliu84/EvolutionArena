# Map and Encounter Design

## v0.1 Map

Use **one fixed handcrafted map** with semi-random content.

Recommended greybox traversal:
- ~45–60 seconds to cross the playable width without combat at base speed.
- Major landmarks visible or inferable from nearby paths.
- Loops and shortcuts rather than long dead ends.
- Safe starting ring(s) separated from high-threat center/outer pockets.

The exact world-unit dimensions depend on current Phaser camera scale; tune by traversal time rather than arbitrary pixels.

## Spawn System

### Player Spawn
Choose randomly from 6–10 authored safe spawn anchors. **Current status:** planned; the prototype still uses one fixed Gloamwood start.

Rules:
- no elite/boss within immediate aggro distance;
- nearby starter prey guaranteed;
- at least two viable route directions;
- avoid selecting the same spawn repeatedly when possible.

### Creature Spawn
Use authored **spawn zones** with weighted species tables rather than unconstrained random coordinates. **Current status:** planned; the prototype currently uses 27 authored encounter positions and three seeded vertical layout offsets.

Each zone defines:
- allowed species;
- min/max population;
- threat budget;
- gene-family bias;
- respawn delay;
- elite chance;
- environmental modifiers.

## Ecology Director

A lightweight run director should maintain target population ranges and periodically repopulate empty zones. It should create variation without obvious “enemy appears beside player” spawning. This is the next replayability system after the first forest visual slice is integrated.

## Encounter Layers

1. Common prey packs
2. Common hunters
3. Specialist species
4. Roaming elite
5. Rare gene encounter
6. Boss arena/event

## Secrets

v0.1 supports a few authored secret locations whose *activation/reward* can vary:
- cave cache;
- ancient nest;
- meteor/crystal node;
- hidden mutation shrine.

This provides discovery without requiring procedural map generation.

## Dynamic Events — Later Gate

Candidate future events:
- wildfire;
- flood;
- frost wave;
- meteor strike;
- migration;
- predator outbreak.

The current prototype contains three one-shot authored gene events, one per biome. Do not add weather/disaster events until the base loop is validated.
