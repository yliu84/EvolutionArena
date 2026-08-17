import type { GloamwoodPreyKind } from './gloamwood-3d-ecology'

/**
 * Route portraits for the evolution choice screen.
 *
 * A photo of the resulting creature cannot work here: both candidates in a
 * family load the same body, so two cards in one family would carry an
 * identical picture and imply a difference that does not exist. The still
 * therefore reads the *route*, which is what actually differs.
 */
const PORTRAITS: Record<GloamwoodPreyKind, string> = {
  fang: '/assets/gloamwood/evolution/fang.png',
  shell: '/assets/gloamwood/evolution/shell.png',
  swarm: '/assets/gloamwood/evolution/swarm.png',
}

export function gloamwoodFamilyPortrait(family: GloamwoodPreyKind): string {
  return `<img class="g3d-route-mark" src="${PORTRAITS[family]}" alt="" width="1024" height="682" decoding="async">`
}
