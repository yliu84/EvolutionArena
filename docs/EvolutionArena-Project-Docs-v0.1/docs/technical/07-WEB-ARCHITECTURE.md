# Browser Technical Architecture

## Current Direction

The existing repository is a browser-native TypeScript project using **Phaser 3**, **Vite**, and **Vitest**. Preserve that direction for the first validation build.

## Architecture Goal

Keep **game rules independent from rendering/input** wherever practical. This improves testability and leaves room for future ports or networking.

## Recommended Layers

### 1. Domain / Simulation
Pure TypeScript where possible:
- stats;
- damage formulas;
- genes;
- mutation eligibility;
- evolution stages;
- spawn budgets;
- run clock;
- rewards.

No Phaser object references in core rules unless unavoidable.

### 2. Game Runtime
Phaser-facing systems:
- scenes;
- entities/views;
- movement;
- collision;
- animation;
- camera;
- VFX/audio;
- input.

### 3. Content/Data
Declarative configs:
- creature definitions;
- mutations;
- evolution thresholds;
- spawn tables;
- biome definitions;
- boss patterns.

Avoid hardcoding balance constants across scene code.

### 4. UI
HUD, evolution draft, pause, results, encyclopedia.

### 5. Persistence
Local browser storage for:
- settings;
- discoveries;
- run history;
- accessibility options.

No account/backend in v0.1.

## Suggested Source Shape

```text
src/
  core/
    combat/
    evolution/
    genes/
    run/
    spawning/
  content/
    creatures/
    mutations/
    biomes/
    bosses/
  game/
    scenes/
    entities/
    systems/
    rendering/
    input/
  ui/
  persistence/
  telemetry/
  shared/
tests/
  core/
  integration/
```

Adapt to the existing code instead of performing a destructive rewrite solely to match this tree.

## Deterministic Run Seed

Introduce a run seed early. It enables:
- reproducible bugs;
- fair playtest comparison;
- future daily challenges;
- deterministic spawn/evolution testing.

Random services should be injected/centralized rather than scattered `Math.random()` calls.

## Event Model

Use typed game/domain events for meaningful transitions:
- CreatureKilled
- CreatureConsumed
- GeneCollected
- EvolutionReady
- MutationSelected
- StageAdvanced
- EliteSpawned
- BossStarted
- RunEnded

Avoid building an over-engineered global event bus for trivial frame updates.

## Future Multiplayer Readiness

Do now:
- separate simulation state from presentation;
- identify authoritative actions;
- avoid UI directly mutating world state;
- keep content IDs stable.

Do **not** now:
- add sockets;
- build server authority;
- implement reconciliation;
- build matchmaking.

## Testing

Vitest should cover pure rules:
- gene weighting;
- mutation eligibility;
- evolution thresholds;
- damage/status math;
- spawn selection;
- deterministic seeds.

Browser/manual tests cover feel and rendering.
