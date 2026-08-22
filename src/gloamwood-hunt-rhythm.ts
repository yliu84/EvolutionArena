/**
 * The combat authority already owns every Boss phase. This tiny presentation
 * and order helper only explains what that phase asks of a single-button hunt:
 * do not auto-walk into a committed blow, then make recovery readable as the
 * moment to go back in. It deliberately has no damage, range or hit logic.
 */
export type GloamwoodHuntRhythm = 'advance' | 'evade' | 'counter'

export function resolveGloamwoodHuntRhythm(isBoss: boolean, phase: string | null | undefined): GloamwoodHuntRhythm {
  if (!isBoss) return 'advance'
  if (phase === 'telegraph' || phase === 'strike' || phase === 'attack') return 'evade'
  if (phase === 'recover') return 'counter'
  return 'advance'
}

/** Automatic approach pauses only while a Boss has committed to a hit. */
export function gloamwoodHuntRhythmStopsAutoEngage(rhythm: GloamwoodHuntRhythm) {
  return rhythm === 'evade'
}
