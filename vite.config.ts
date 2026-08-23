import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages serves a project repository from a subpath, not the domain
  // root. Paths under public/ are string literals the bundler cannot rewrite,
  // so src/asset-url.ts resolves them against this at the fetch boundary.
  // Unset - dev, preview, any root-served host - it stays '/'.
  base: process.env.DEPLOY_BASE ?? '/',

  build: {
    rollupOptions: {
      output: {
        // Three is stable across ordinary gameplay/UI releases but accounts for
        // most of the previous 940 kB hunt file. Give it its own long-lived
        // cache key; GLTFLoader/SkeletonUtils stay beside it because both are
        // required before the River Valley scene can create its first model.
        // This is deliberately a vendor split, not a loading-order change:
        // River Valley still starts only after all of its required modules are
        // available, avoiding a blank world or a late model swap on mobile.
        // Vite 8 uses Rolldown here, whose supported manual-chunk form is a
        // function rather than Rollup's older object shorthand.
        manualChunks(id) {
          if (
            id.includes('/node_modules/three/')
            || id.includes('/node_modules/three/examples/jsm/')
          ) return 'three-runtime'
        },
      },
    },
  },

  // `public/` is the shipped payload: everything in it is copied verbatim into
  // dist and served to players. Authoring intermediates - Meshy exports, rig
  // iterations, superseded map bakes - live in `art-source/`, which is tracked
  // but never built.
  //
  // A build-time prune plugin used to keep the two mixed together behind a
  // hand-written allowlist of runtime models. The list drifted: the Shell first
  // evolution shipped and was never added, so every production build deleted
  // the Stone Pangolin runtime model and the accepted form 404'd for players.
  // Dev never showed it, because dev serves public/ directly. The directory
  // split removes the drift surface instead of maintaining the list;
  // tests/public-payload.test.ts holds the two in agreement.
})
