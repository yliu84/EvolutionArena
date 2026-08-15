# Evolution Arena — Project Documentation v0.1

This package is the current product/design/technical blueprint for **Evolution Arena**. It has been calibrated against the local TypeScript source and tests. When an older discussion conflicts with this package, the decision log and current implementation notes in this package take precedence.

## Project North Star

> Every feature must strengthen the player's desire to start **one more run**.

The first release is a **browser-first single-player validation build**, not the final commercial scope. Multiplayer remains a future option, but it must not be allowed to hide weaknesses in the core evolution loop.

## Current Prototype Context

The public repository currently uses a web stack built around **TypeScript + Vite + Phaser 3**, with Vitest available for tests. This documentation therefore treats the current game as a browser-native project rather than a Unity project.

## Documentation Map

- `docs/00-PROJECT-CHARTER.md` — vision, pillars, scope rules
- `docs/01-GDD.md` — master Game Design Document
- `docs/design/02-CORE-LOOP.md` — minute-to-minute and run-to-run loop
- `docs/design/03-MAP-AND-ENCOUNTERS.md` — map, spawn logic, encounters, events
- `docs/design/04-CREATURES-AND-BOSSES.md` — 10-creature launch roster, elites, bosses
- `docs/design/05-EVOLUTION-AND-GENES.md` — six-stage evolution and gene system
- `docs/design/06-META-PROGRESSION.md` — collection and unlocks without pay-to-win power creep
- `docs/technical/07-WEB-ARCHITECTURE.md` — browser architecture and portability
- `docs/technical/08-PERFORMANCE-BUDGET.md` — browser performance budgets
- `docs/art/09-ART-BIBLE.md` — 2.5D visual direction and AI-art pipeline
- `docs/art/19-CHARACTER-QUALITY-BASELINE.md` — accepted coral-gecko data, pending weight gate, and reusable creature/evolution template
- `docs/production/10-ROADMAP.md` — gated development roadmap
- `docs/production/11-BACKLOG.md` — prioritized feature backlog
- `docs/production/12-PLAYTEST-PLAN.md` — validation metrics and test protocol
- `docs/production/13-DECISION-LOG.md` — decisions already made
- `docs/production/14-DEFINITION-OF-DONE.md` — quality bar
- `docs/reference/15-CODEX-HANDOFF.md` — working rules for Codex/AI coding agents
- `docs/production/18-MAP-UI-CREATURE-POLISH-PLAN.md` — gated map, UI, creature and skill polish order

## v0.1 Definition

v0.1 is deliberately opinionated. Numbers such as health, damage, XP, spawn density, and mutation percentages are **starting hypotheses**, not sacred balance values. They should live in data/config and be tuned from playtest evidence.

Current core rule: prey choice drives an automatic, readable evolution after a short preview. Evolution is not a pause-and-pick three-card draft. The first validation target is a 12–18 minute normal clear with no hard timer; post-Apex overgrowth is optional risk, not required duration.
