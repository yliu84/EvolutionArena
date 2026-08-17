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

The v2 and v3 map bakes were moved here and moved straight back: the frozen
MapLab 2 and 3 tools still load them, and they address them without a leading
slash (`assets/map-lab-v2/...`), which a first pass at finding orphans missed.
`tests/public-payload.test.ts` now resolves every asset reference in `src/` and
`index.html` against `public/`, so the next such move fails loudly.

`tests/public-payload.test.ts` holds the split: `public/assets/quality-3d/models`
must contain exactly the files `QUALITY_3D_GLB_ASSETS` can resolve — no more, no
fewer. Adding a runtime model means adding it to the registry and to `public/`;
the test fails either way round.
