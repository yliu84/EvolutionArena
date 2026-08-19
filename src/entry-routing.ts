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
 * Which map a run is played on.
 *
 * The valley began as its own entry, on the grounds that a half-built map
 * reachable from the front door is how a tester records a session against the
 * wrong build. It has encounters now, so it is a map rather than a review tool
 * - and keeping it separate had started to grow a second player, a second
 * combat loop and a second HUD beside the ones the hunt already has.
 */
export function gloamwoodMapFromEntry(search = window.location.search) {
  return new URLSearchParams(search).get('map') === 'valley' ? 'valley' : 'gloamwood'
}
