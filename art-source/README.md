# art-source

Authoring artefacts that must survive but must never be served.

`public/` is the shipped payload: Vite copies all of it into `dist` verbatim and
every file in it is reachable by any player. This directory is the other half of
that rule — Meshy exports, superseded rig iterations, production blockouts, toon
experiments and retired map bakes are tracked here so the production history is
recoverable, and no build ever touches them.

Contents:

- `quality-3d-models/` — 22 GLBs from the creature pipeline. The six models the
  runtime actually resolves stay in `public/assets/quality-3d/models/`.
- `map-lab/` — the v2 and v3 map bakes, superseded by MapLab 4 and 5.

`tests/public-payload.test.ts` holds the split: `public/assets/quality-3d/models`
must contain exactly the files `QUALITY_3D_GLB_ASSETS` can resolve — no more, no
fewer. Adding a runtime model means adding it to the registry and to `public/`;
the test fails either way round.
