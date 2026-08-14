import type { CombatStyle } from './combat'

export const COMBAT_JUICE = {
  hitstopHitMs: 52,
  hitstopMagicMs: 72,
  hitstopRangedConnectMs: 40,
  hitstopWhiffMs: 0,
  hitstopTimeScale: 0.18,
  meleeShake: 0.0055,
  rangedShake: 0.0026,
  magicShake: 0.0072,
  connectShake: 0.0034,
  meleeBurstMs: 280,
  rangedBurstMs: 220,
  magicBurstMs: 420,
  sparkLifetimeMs: 280,
  sparkCountHit: 8,
  sparkCountWhiff: 3,
  sparkCountRangedConnect: 6,
  maxActiveSparks: 40,
  meleeTint: 0xffe39a,
  rangedTint: 0x9effcf,
  magicTint: 0xe0b0ff,
} as const

export function juiceBurstMs(style: CombatStyle) {
  if (style === 'melee') return COMBAT_JUICE.meleeBurstMs
  if (style === 'ranged') return COMBAT_JUICE.rangedBurstMs
  return COMBAT_JUICE.magicBurstMs
}

export function hitstopMsForImpact(style: CombatStyle, hits: number) {
  if (style === 'ranged') return COMBAT_JUICE.hitstopWhiffMs
  if (style === 'magic') return hits > 0 ? COMBAT_JUICE.hitstopMagicMs : 28
  return hits > 0 ? COMBAT_JUICE.hitstopHitMs : COMBAT_JUICE.hitstopWhiffMs
}

export function shakeIntensityForImpact(style: CombatStyle, hits: number) {
  const connected = hits > 0
  if (style === 'melee') return connected ? COMBAT_JUICE.meleeShake : COMBAT_JUICE.meleeShake * 0.35
  if (style === 'ranged') return COMBAT_JUICE.rangedShake
  return connected ? COMBAT_JUICE.magicShake : COMBAT_JUICE.magicShake * 0.4
}

export function juiceProgress(startedAt: number, now: number, durationMs: number) {
  if (durationMs <= 0) return 1
  return Math.max(0, Math.min(1, (now - startedAt) / durationMs))
}

export function sparkCountForImpact(style: CombatStyle, hits: number) {
  if (style === 'ranged') return COMBAT_JUICE.sparkCountWhiff
  if (hits <= 0) return COMBAT_JUICE.sparkCountWhiff
  return COMBAT_JUICE.sparkCountHit
}

export function juiceTint(style: CombatStyle) {
  if (style === 'melee') return COMBAT_JUICE.meleeTint
  if (style === 'ranged') return COMBAT_JUICE.rangedTint
  return COMBAT_JUICE.magicTint
}
