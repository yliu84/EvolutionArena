import type { EliteAffixId } from './elite-affixes'

/**
 * Presentation-only threat language shared by the target plate and the
 * creature's world marker. Combat owns tier, health and phase; this module
 * merely makes those facts immediately recognisable.
 */
export type GloamwoodThreatTier = 'normal' | 'elite' | 'boss'

export interface GloamwoodThreatInput {
  tier?: string
  eliteAffix?: EliteAffixId
  boss?: boolean
}

export function gloamwoodThreatTier(input: GloamwoodThreatInput): GloamwoodThreatTier {
  if (input.boss || input.tier === 'boss') return 'boss'
  if (input.tier === 'elite' || input.eliteAffix) return 'elite'
  return 'normal'
}

/** A shape marker keeps the tier readable when colour is unavailable. */
export function gloamwoodThreatMark(tier: GloamwoodThreatTier) {
  return tier === 'boss' ? '◆' : tier === 'elite' ? '◇' : ''
}

/**
 * A Boss owns the fixed encounter plate at the top of the screen. Its
 * in-world seal remains, but duplicating name, phase and health over the
 * model hides telegraphs instead of adding useful information.
 */
export function gloamwoodUsesWorldTargetPlate(tier: GloamwoodThreatTier) {
  return tier !== 'boss'
}

/**
 * A slow pulse is deliberately reserved for elites. It draws the eye without
 * turning ordinary travel into a field of flashing markers.
 */
export function gloamwoodEliteThreatPulse(elapsedSeconds: number) {
  return 0.5 + 0.5 * Math.sin(elapsedSeconds * Math.PI * 1.35)
}
