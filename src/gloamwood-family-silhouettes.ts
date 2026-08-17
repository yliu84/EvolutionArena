import type { GloamwoodPreyKind } from './gloamwood-3d-ecology'

/**
 * Route silhouettes for the evolution choice screen.
 *
 * A photo of the resulting creature cannot work here: both candidates in a
 * family load the same body, so two cards in one family would carry an
 * identical picture and imply a difference that does not exist. The silhouette
 * therefore reads the *route*, which is what actually differs.
 *
 * Each is a side profile matching the body plan that family produces at stage 1,
 * drawn to read at roughly 130px wide. Inline SVG rather than rendered art: no
 * extra download, no asset pipeline, and it inherits currentColor so it works on
 * either theme and in both locales.
 */

// Fang: agile predator. Raised head and crest, deep chest, long tapering tail.
const FANG = `
<path d="M13 27 L20 20 L22 26 L30 22 L31 29 C40 27 50 28 57 33
 C63 37 68 39 74 40 C69 44 62 45 56 44
 C52 48 44 50 36 49 C28 48 20 44 16 38 C13 34 12 30 13 27 Z" />
<path d="M22 47 L20 56 M31 49 L30 57 M44 49 L46 57 M53 46 L56 55"
 fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" />
<circle cx="20" cy="30" r="1.9" fill="var(--g3d-eye, #0b120c)" />`

// Carapace: low broad plate mound. Small tucked head, thick plated tail.
const SHELL = `
<path d="M18 44 C16 30 28 21 42 21 C56 21 66 28 69 38 L74 44
 C66 47 58 48 50 48 L26 48 C21 48 18 47 18 44 Z" />
<path d="M18 43 C20 33 26 27 34 24 M33 45 C33 34 35 28 38 23
 M46 45 C46 34 46 28 45 23 M58 45 C57 36 55 30 51 25"
 fill="none" stroke="var(--g3d-seam, rgba(0,0,0,.4))" stroke-width="2.4" stroke-linecap="round" />
<path d="M18 44 C34 40 58 40 72 44" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
<path d="M18 42 C12 41 8 44 9 48 C11 51 16 51 19 48 Z" />
<circle cx="13" cy="45" r="1.7" fill="var(--g3d-eye, #0b120c)" />
<path d="M25 48 h6 v8 h-6 z M38 48 h6 v8 h-6 z M52 48 h6 v8 h-6 z M63 47 h6 v8 h-6 z" />`

// Swarm: light and long-limbed, trailed by symbiote spores.
const SWARM = `
<path d="M24 32 C24 25 31 21 40 21 C50 21 57 25 57 32
 C57 38 51 42 40 42 C30 42 24 38 24 32 Z" />
<path d="M28 40 L20 54 M36 42 L33 56 M47 42 L50 56 M55 39 L63 52"
 fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" />
<path d="M24 31 C19 28 16 29 14 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
<circle cx="31" cy="30" r="2" fill="var(--g3d-eye, #0b120c)" />
<circle cx="64" cy="20" r="4.6" opacity=".5" />
<circle cx="71" cy="30" r="3.2" opacity=".38" />
<circle cx="57" cy="12" r="3" opacity=".3" />
<circle cx="14" cy="16" r="3.4" opacity=".42" />`

const PATHS: Record<GloamwoodPreyKind, string> = { fang: FANG, shell: SHELL, swarm: SWARM }

export function gloamwoodFamilySilhouette(family: GloamwoodPreyKind): string {
  return `<svg class="g3d-route-mark" viewBox="0 0 80 60" role="presentation" focusable="false" aria-hidden="true" fill="currentColor">${PATHS[family]}</svg>`
}
