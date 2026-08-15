import type { CombatStyle } from './combat'
import { monsterPhysicalProfile } from './monster-physicality'
import type { MonsterType } from './monsters'

export type MonsterImpactWeight = 'light' | 'medium' | 'heavy'

export interface ImpactFeedbackProfile {
  style: CombatStyle
  weight: MonsterImpactWeight
  killed: boolean
  hitStopMs: number
  knockback: number
  recoilMs: number
  shakeDurationMs: number
  shakeIntensity: number
  burstScale: number
  toneHz: number
  toneDurationMs: number
}

const STYLE_IMPACT = {
  melee: {
    hitStopMs: 58, knockback: 190, recoilMs: 145, shakeDurationMs: 82, shakeIntensity: 0.0028,
    burstScale: 1.08, toneHz: 118, toneDurationMs: 74,
  },
  ranged: {
    hitStopMs: 30, knockback: 92, recoilMs: 95, shakeDurationMs: 48, shakeIntensity: 0.0014,
    burstScale: 0.82, toneHz: 228, toneDurationMs: 48,
  },
  magic: {
    hitStopMs: 46, knockback: 138, recoilMs: 125, shakeDurationMs: 72, shakeIntensity: 0.0022,
    burstScale: 1.22, toneHz: 172, toneDurationMs: 96,
  },
} as const satisfies Record<CombatStyle, Omit<ImpactFeedbackProfile, 'style' | 'weight' | 'killed'>>

const WEIGHT_KNOCKBACK_MULTIPLIER: Record<MonsterImpactWeight, number> = {
  light: 1,
  medium: 0.68,
  heavy: 0.38,
}

export function monsterImpactWeight(type: MonsterType, elite = false): MonsterImpactWeight {
  const profile = monsterPhysicalProfile(type)
  if (profile.colliderRadius >= 44 || (elite && profile.locomotion === 'ground')) return 'heavy'
  if (profile.baseScale >= 1.16 || elite) return 'medium'
  return 'light'
}

export function resolveImpactFeedback(
  style: CombatStyle,
  type: MonsterType,
  elite = false,
  killed = false,
): ImpactFeedbackProfile {
  const weight = monsterImpactWeight(type, elite)
  const base = STYLE_IMPACT[style]
  const deathScale = killed ? 1.32 : 1
  return {
    style,
    weight,
    killed,
    hitStopMs: Math.round(base.hitStopMs * (killed ? 1.45 : 1)),
    knockback: Math.round(base.knockback * WEIGHT_KNOCKBACK_MULTIPLIER[weight] * deathScale),
    recoilMs: Math.round(base.recoilMs * (killed ? 1.18 : 1)),
    shakeDurationMs: Math.round(base.shakeDurationMs * (killed ? 1.55 : 1)),
    shakeIntensity: Number((base.shakeIntensity * (killed ? 1.45 : 1)).toFixed(5)),
    burstScale: Number((base.burstScale * deathScale).toFixed(2)),
    toneHz: Math.round(base.toneHz * (weight === 'heavy' ? 0.74 : weight === 'medium' ? 0.88 : 1)),
    toneDurationMs: Math.round(base.toneDurationMs * (killed ? 1.5 : 1)),
  }
}
