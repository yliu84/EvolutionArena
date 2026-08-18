/**
 * Selectors for the frozen stacks. Each of these is a tool kept working for
 * reference, not a thing to hand to a player.
 */
const FROZEN_STACK_SELECTORS: readonly (readonly [string, string])[] = [
  ['maplab', '1'],
  ['maplab', '2'],
  ['maplab', '3'],
  ['maplab', '4'],
  ['huntlab', '1'],
  ['nestlab', '1'],
  ['quality', '1'],
  ['quality3d', '1'],
  ['classic', '1'],
]

/**
 * MapLab 5 is the game, so it is what a bare URL opens.
 *
 * `?maplab=5` began as a dev switch while the 3D body was being built, which
 * left the deployed site defaulting to the frozen Phaser prototype. Anyone
 * handed the playtest link without the query string played the old 2D
 * prototype - a stranger in a no-instruction test would have had no way to know
 * they were in the wrong game, and the session would have been recorded against
 * the wrong build.
 *
 * The frozen stacks keep working; they now need to be asked for by name, and
 * the classic prototype has its own `?classic=1` since it no longer owns the
 * empty query string.
 */
export function isGloamwood3DEntry(search = window.location.search) {
  const params = new URLSearchParams(search)
  if (params.get('maplab') === '4' && params.get('live') === '1') return true
  return !FROZEN_STACK_SELECTORS.some(([key, value]) => params.get(key) === value)
}

/**
 * The valley walkthrough.
 *
 * Its own entry rather than a flag inside the hunt: the valley has no
 * encounters on it yet, and a half-built map reachable from the game's front
 * door is exactly how a tester ends up recording a session against the wrong
 * build. It is a review tool until the encounters move onto it.
 */
export function isGloamwoodValleyEntry(search = window.location.search) {
  return new URLSearchParams(search).get('map') === 'valley'
}
