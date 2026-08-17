# Evolution and Gene System

## Principle

**Hunt first; the body answers.**

The player's primary build choice is which prey to pursue. Evolution is directed but not fully deterministic: recent prey, cumulative genes, combination pressure and controlled wild mutation determine what emerges.

## Evolution Meter

Soul orbs grant Biomass. Current six-stage thresholds are data-driven: 60, 80, 90, 100, 110 and 120. At the threshold, the leading family is previewed for roughly 2.2 seconds and one eligible mutation automatically emerges without pausing combat. A run grants one Resist charge that preserves about 70% progress and lets the player keep hunting to alter the tendency.

Thresholds must be data-driven and tuned to the desired run clock.

## Gene Inventory

Genes are run-scoped weighted tags:
- Fang / 獠牙 — direct damage and melee execution
- Wing / 翼族 — movement and dodge cadence
- Carapace / 甲壳 — health and damage reduction
- Swarm / 虫群 — biomass efficiency and kill sustain
- Venom / 毒液 — ranged pressure and retaliation
- Rift / 裂隙 — ranged cadence and magic area

Killing/consuming a species adds weight to one or more tags.

## Automatic Resolver — v0.1

At evolution:
1. Calculate tendency from recent hunts (about 60%) and cumulative genes (about 40%).
2. Detect a leading family and a possible near-equal combination family.
3. Apply repetition pressure after repeated same-family growth.
4. Allow a small controlled wild-mutation chance.
5. Select one eligible mutation automatically with deterministic seeded randomness.
6. Apply rank limits and record the reason in the final gene chain.

This keeps surprise while locating agency in hunting rather than a pause menu.

## Six Stages

### Stage I — Hatchling
Base creature. No major mutation.

### Stage II — Adaptation
First strong visible trait. Establish direction.

### Stage III — Hunter
Adds mobility/attack/defense identity.

### Stage IV — Predator
Synergy begins; elite hunting becomes efficient.

### Stage V — Alpha
Large visual transformation and powerful trade-off.

### Stage VI — Apex
Capstone mutation; should feel qualitatively different.

After Stage VI, optional overgrowth raises world and boss pressure. Formal Stages VII–X are not part of v0.1 and require the later long-run gate.

Stages are timing/progression levels, not one universal species ladder. Runtime form resolution uses stage plus dominant family and an optional compatible secondary family. The v1 authored graph contains one origin, six family lineages and thirteen Apex endpoints (six pure and seven curated hybrids), documented in `20-RANDOM-EVOLUTION-SPECIES-MATRIX.md`. Once an Apex is reached, its species ID and capstone mechanics are locked for the run; overgrowth cannot reroll the endpoint.

## Current Mutation Families

### Fang
- Serrated Claws — all attack damage
- Execution Fangs — melee specialization

### Wing
- Swift Nerves — movement speed
- Wind Sacs — dodge cadence

### Carapace
- Reactive Shell — maximum health
- Mirror Carapace — damage reduction

### Swarm
- Symbiotic Brood — biomass efficiency
- Devouring Colony — healing on kill

### Venom
- Toxin Coating — ranged damage
- Toxic Blood — contact retaliation

### Rift
- Pulse Gland — ranged cooldown
- Rift Chamber — magic area and damage

Each mutation currently supports two ranks. Several effects remain stat-led; route polish must add behavior, timing, visual tells or trade-offs so each family changes how the player fights.

The stage-6 resolver applies an additional species capstone to the same authoritative combat state. Every Apex defines a normal-attack profile, locomotion profile, passive, explicit cost and a unique combination of damage, speed, dodge, health, defense, resource, sustain, retaliation, cadence or area changes. These mechanics are not owned by animation or UI text.

## Visual Mutation Slots

Keep anatomy modular:
- Head
- Back
- Tail
- Skin/material
- Scale/body proportion
- VFX attachment

Do not support arbitrary limb-count/skeleton changes in v0.1.

## Balance Guardrails

- Automatic growth should not feel like an unrelated punishment; trade-offs must be readable and route-consistent.
- Strong effects need visible tells.
- Synergy is desirable; unstoppable deterministic combos are not.
- The player should understand *why* a mutation appeared.
