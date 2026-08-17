/**
 * Resolve a path under `public/` against the base the app is deployed at.
 *
 * Vite rewrites the assets it imports, but everything under `public/` is
 * addressed by string literal - `/assets/terrain/forest.jpg` and friends - and
 * the bundler cannot see those. Served from the domain root that is correct.
 * Served from a subpath, which is what GitHub Pages does for a project site,
 * every one of them resolves to the wrong origin path and 404s.
 *
 * Applied at the fetch boundary rather than at the declarations, so the asset
 * registries stay readable as data and keep matching the files on disk.
 */
export function assetUrl(path: string) {
  const base = import.meta.env.BASE_URL || '/'
  if (!path.startsWith('/')) return `${base.replace(/\/+$/, '/')}${path}`
  return `${base.replace(/\/+$/, '')}${path}`
}
