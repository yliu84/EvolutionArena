# Codex / AI Coding Agent Handoff

Use this document as project-level guidance when asking an AI coding agent to modify Evolution Arena.

## Product North Star

Every change should support:
**“The player wants to start one more run because they want to discover/build a different creature.”**

## Current Scope

Browser-first single-player validation game.
Do not introduce multiplayer, accounts, monetization or large framework migrations unless explicitly approved.

Evolution is automatic and hunt-driven. Do not reintroduce a three-choice mutation draft unless a later measured playtest explicitly reverses this decision. The current validation target is a 12–18 minute normal clear with no hard timer and optional post-Stage-VI overgrowth.

## Engineering Rules

1. Read existing code before proposing a rewrite.
2. Prefer incremental refactors.
3. Keep core game rules testable outside Phaser where practical.
4. Keep balance/content data-driven.
5. Centralize seeded randomness.
6. Avoid unnecessary dependencies.
7. Preserve browser performance.
8. Add/adjust Vitest tests for deterministic game logic.
9. Run build and tests before completion.
10. Update docs/decision log for meaningful design/architecture changes.

## Before Implementing a Feature

State:
- player-facing purpose;
- files/modules affected;
- data changes;
- tests;
- performance risk;
- whether it changes GDD assumptions.

## Architecture Review Checklist

When reviewing the current repository, specifically inspect:
- scene responsibilities;
- entity ownership/lifecycle;
- collision/combat coupling;
- spawn logic;
- enemy AI update cost;
- mutation/evolution data model;
- randomness;
- global state;
- restart/reset behavior;
- testability;
- asset loading;
- resize/resolution handling;
- persistence;
- build/deploy path.

## Avoid

- giant god classes/scenes;
- balance constants scattered in code;
- `Math.random()` throughout systems;
- UI directly changing domain state;
- per-frame object churn;
- speculative multiplayer infrastructure;
- premature ECS rewrite;
- large dependency additions for small problems.
