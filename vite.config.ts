import { defineConfig } from 'vite'

export default defineConfig({
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
