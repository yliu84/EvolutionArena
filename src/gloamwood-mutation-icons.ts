/**
 * A glyph per mutation, drawn rather than loaded.
 *
 * Eight icons is not worth an atlas, a loader or a cache tag, and inline paths
 * recolour with the family without a second asset. Each one reads at 26px,
 * which is the size the strip actually renders at - detail below that is
 * invisible, exactly as it is on the creatures themselves.
 */
const MUTATION_GLYPHS: Record<string, string> = {
  // A fang, for the execute bonus.
  'fang-killer-instinct': '<path d="M6 4h12l-2 7-4 9-4-9z"/>',
  // A hide split open: more damage through less protection.
  'fang-thin-hide': '<path d="M12 3l7 3v6c0 5-3 8-7 9-4-1-7-4-7-9V6z" fill="none" stroke-width="1.8"/><path d="M12 3v18" stroke-width="1.8" stroke-dasharray="2 2.4"/>',
  // Concentric rings leaving a struck centre.
  'shell-quake': '<circle cx="12" cy="12" r="2.4"/><circle cx="12" cy="12" r="6" fill="none" stroke-width="1.6"/><circle cx="12" cy="12" r="9.4" fill="none" stroke-width="1.2" opacity=".62"/>',
  // Two bodies sharing one wound.
  'shell-symbiosis': '<circle cx="8.4" cy="12" r="4.6" fill="none" stroke-width="1.8"/><circle cx="15.6" cy="12" r="4.6" fill="none" stroke-width="1.8"/><path d="M12 8.6v6.8" stroke-width="1.8"/>',
  // A shed casing with the body already out of it.
  'swarm-moult': '<path d="M15 4c-6 0-9 4-9 8s3 8 9 8" fill="none" stroke-width="1.9"/><circle cx="16.4" cy="12" r="3.2"/>',
  // Spores hanging in the air.
  'swarm-sporehaze': '<circle cx="8" cy="8.4" r="2"/><circle cx="15.4" cy="7.4" r="1.5"/><circle cx="12" cy="13" r="2.4"/><circle cx="17" cy="14.6" r="1.7"/><circle cx="7.4" cy="16" r="1.5"/>',
  // An hourglass: growth bought with time.
  'neutral-starving-metabolism': '<path d="M6 3h12L12 12l6 9H6l6-9z"/>',
  // Open jaws that keep asking for more.
  'neutral-gluttony': '<path d="M3.4 9.6c3-3.4 14.2-3.4 17.2 0-3 1.4-5.6 2-8.6 2s-5.6-.6-8.6-2z"/><path d="M3.4 14.4c3 3.4 14.2 3.4 17.2 0-3-1.4-5.6-2-8.6-2s-5.6.6-8.6 2z"/>',
}

const FALLBACK_GLYPH = '<circle cx="12" cy="12" r="6.4" fill="none" stroke-width="2"/>'

export function gloamwoodMutationIcon(id: string) {
  const glyph = MUTATION_GLYPHS[id] ?? FALLBACK_GLYPH
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round">${glyph}</svg>`
}

export function gloamwoodMutationIconIds() {
  return Object.keys(MUTATION_GLYPHS)
}
