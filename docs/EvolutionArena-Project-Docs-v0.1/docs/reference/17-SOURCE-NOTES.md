# Source Notes

This v0.1 documentation was created from the project's design discussion and a public inspection of the EvolutionArena repository on 2026-08-14.

Observed repository facts used in the technical plan:
- repository: `yliu84/EvolutionArena`
- public branch: `main`
- top-level folders include `.cursor`, `docs`, `public`, `src`, `tests`
- package scripts use Vite, TypeScript and Vitest
- runtime dependency includes Phaser 3

The package was calibrated against the local `src/` and `tests/` implementation on 2026-08-14. Current implementation facts and the decision log supersede earlier blueprint assumptions such as a three-choice draft, a 15-minute hard cap, ten species, or old gene-family names. Major refactoring still requires an incremental file-by-file plan rather than a destructive directory rewrite.
