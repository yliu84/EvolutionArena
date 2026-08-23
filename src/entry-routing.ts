/**
 * River Valley is the only shipped game entry. Historical MapLab and quality
 * selectors deliberately fall through here instead of reviving an old payload.
 */
export function isGloamwood3DEntry(_search = window.location.search) {
  return true
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
  // The river valley is now the completed playtest route. The compact
  // Gloamwood nest remains useful as a focused combat lab, but it must be
  // requested explicitly; a new player should never land in a retired sample
  // and mistake it for the game.
  return new URLSearchParams(search).get('map') === 'gloamwood' ? 'gloamwood' : 'valley'
}
