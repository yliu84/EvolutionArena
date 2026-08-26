/**
 * River Valley is the only shipped game entry. Historical MapLab and quality
 * selectors deliberately fall through here instead of reviving an old payload.
 */
export function isGloamwood3DEntry(_search = window.location.search) {
  return true
}

export type GloamwoodMapId = 'valley' | 'gloamwood' | 'defence'

/**
 * The map named in the URL, or `null` when nobody has named one.
 *
 * Null is the whole point of this function. "This link is for the valley" and
 * "no choice has been made yet" are different states, and only the second one
 * should put a picker in front of the player - but the resolver below folds
 * both into `valley`, which is why the altar defence mode spent its whole life
 * reachable only by typing a query string by hand.
 *
 * `gloamwood` is still here and still absent from the picker: it is a retired
 * combat lab kept for focused testing, not a mode anyone should be offered.
 */
export function gloamwoodMapFromSearch(search = window.location.search): GloamwoodMapId | null {
  const requested = new URLSearchParams(search).get('map')
  if (requested === 'gloamwood') return 'gloamwood'
  if (requested === 'defence') return 'defence'
  if (requested === 'valley') return 'valley'
  return null
}

/**
 * Which map a run is played on when the answer has to be a map.
 *
 * A map is a property of the run rather than of the build, so it stays in the
 * URL: a link reproduces the mode it was taken from, which is what a bug report
 * or a shared link needs.
 */
export function gloamwoodMapFromEntry(search = window.location.search): GloamwoodMapId {
  return gloamwoodMapFromSearch(search) ?? 'valley'
}
