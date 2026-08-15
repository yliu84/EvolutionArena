# Creature, Elite and Boss Roster

This is a **design roster**, not final art direction. Names are placeholders.

## Current Roster: 24 Species, 6 Behavior Archetypes

The project already contains 24 named species across Fang, Wing, Carapace, Swarm, Venom and Rift. They reuse six readable combat skeletons: pounce, dash, brace, drain, projectile and spread. Content work should deepen tells, skills and counters inside those archetypes rather than adding more species.

Current biome counts:
- Gloamwood: 8 authored encounters/species slots
- Rotfen: 9 authored encounters/species slots
- Ashen Ruins: 10 authored encounters/species slots
- Total unique species represented: 24

## Design Rule

Every species must teach or advertise at least one mutation family. A player seeing a creature should eventually learn: “If I want *that kind of power*, I should hunt *that*.”

## Elite System

Elites are enhanced authored variants of base species, not ten additional content pipelines.

Implemented elite affixes:
- Berserker: accelerates below half health
- Siphon: heals from damage dealt
- Brood: splits once below half health
- Barrier: breakable shield
- Volatile: telegraphed toxic death burst

Use at most one major modifier per elite in v0.1 for readability.

## Boss 1 — Rift Warden

Purpose: required final skill/build check after three sigils and Stage VI.

Design:
- 3 readable attacks;
- one arena-control mechanic;
- vulnerable windows;
- rewards a gold soul orb and completes the run.
- player death ends the run; there are no free retries in the validation mode.

## Boss 2 — Rare/Optional (Post-validation)

A conditional boss with a unique gene family or mutation. It should be discoverable in only some runs or require a condition, creating replay curiosity.

## Boss Constraints

- Avoid bullet-sponge tuning.
- Telegraph attacks clearly in 2.5D camera.
- A boss should take roughly 60–120 seconds for a viable build.
- Boss mechanics must remain legible on a browser at modest resolution.
