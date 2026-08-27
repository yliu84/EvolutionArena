import { defineConfig } from 'vite'

/**
 * The Y8 portal SDK, injected only into the Y8 build.
 *
 * It loads from `cdn.y8.com`, and every other target this project ships to is
 * worse for having it: the itch.io zip has to run with no network at all, and
 * on GitHub Pages the request buys nothing and adds a way to fail. The whole
 * build otherwise makes zero off-origin requests, which is a property worth
 * keeping rather than quietly spending.
 *
 * Credentials are public by nature - they identify the game to the portal and
 * are visible in the page source of every Y8 game.
 */
const Y8_SNIPPET = `
    <script src="https://cdn.y8.com/minimal-sdk/2-0/y8.min.js" async></script>
    <script>
      // The game reads window.y8 itself; this only guarantees the ready event
      // has fired by the time it looks, including the race where the SDK
      // finished loading before this listener was attached.
      window.addEventListener('y8sdk.ready', function () {
        window.dispatchEvent(new Event('gloamwood:y8-ready'))
      }, { once: true })
      if (window.y8 && window.y8.emitReadyEvent) window.y8.emitReadyEvent()
    </script>`

function y8SdkPlugin() {
  return {
    name: 'gloamwood-y8-sdk',
    transformIndexHtml(html: string) {
      if (process.env.Y8 !== '1') return html
      return html.replace('</head>', `${Y8_SNIPPET}\n  </head>`)
    },
  }
}

export default defineConfig({
  plugins: [y8SdkPlugin()],
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
