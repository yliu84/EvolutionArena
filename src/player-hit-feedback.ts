import type { MonsterAttackKind } from './monsters'

export type IncomingHitKind = 'contact' | 'ranged' | 'area' | 'environment'
export type FeedbackVolume = 0 | 0.6 | 1

export interface CombatFeedbackSettings {
  shake: boolean
  flash: boolean
  volume: FeedbackVolume
  muted: boolean
}

export interface PlayerHitFeedbackProfile {
  kind: IncomingHitKind
  lethal: boolean
  flashMs: number
  indicatorMs: number
  shakeDurationMs: number
  shakeIntensity: number
  toneHz: number
  toneDurationMs: number
  color: number
}

export const DEFAULT_COMBAT_FEEDBACK_SETTINGS: CombatFeedbackSettings = {
  shake: true,
  flash: true,
  volume: 0.6,
  muted: false,
}

const HIT_KIND_PROFILE: Record<IncomingHitKind, Omit<PlayerHitFeedbackProfile, 'kind' | 'lethal'>> = {
  contact: { flashMs: 120, indicatorMs: 520, shakeDurationMs: 145, shakeIntensity: 0.0055, toneHz: 92, toneDurationMs: 110, color: 0xff704f },
  ranged: { flashMs: 90, indicatorMs: 620, shakeDurationMs: 90, shakeIntensity: 0.0035, toneHz: 164, toneDurationMs: 80, color: 0x78dcff },
  area: { flashMs: 150, indicatorMs: 680, shakeDurationMs: 190, shakeIntensity: 0.0065, toneHz: 72, toneDurationMs: 145, color: 0xd591ff },
  environment: { flashMs: 80, indicatorMs: 440, shakeDurationMs: 70, shakeIntensity: 0.0022, toneHz: 128, toneDurationMs: 70, color: 0xb7e96e },
}

export function incomingHitKindForAttack(attackKind: MonsterAttackKind): IncomingHitKind {
  if (attackKind === 'projectile') return 'ranged'
  if (attackKind === 'spread' || attackKind === 'brace') return 'area'
  return 'contact'
}

export function resolvePlayerHitFeedback(kind: IncomingHitKind, damage: number, lethal: boolean): PlayerHitFeedbackProfile {
  const base = HIT_KIND_PROFILE[kind]
  const damageScale = Math.min(1.35, Math.max(0.85, 0.85 + damage * 0.045))
  const lethalScale = lethal ? 1.45 : 1
  return {
    kind,
    lethal,
    flashMs: Math.round(base.flashMs * (lethal ? 1.5 : 1)),
    indicatorMs: Math.round(base.indicatorMs * (lethal ? 1.25 : 1)),
    shakeDurationMs: Math.round(base.shakeDurationMs * lethalScale),
    shakeIntensity: Number((base.shakeIntensity * damageScale * lethalScale).toFixed(5)),
    toneHz: Math.round(base.toneHz * (lethal ? 0.7 : 1)),
    toneDurationMs: Math.round(base.toneDurationMs * (lethal ? 1.55 : 1)),
    color: base.color,
  }
}

export function damageDirectionDegrees(
  playerX: number,
  playerY: number,
  sourceX?: number,
  sourceY?: number,
) {
  if (!Number.isFinite(sourceX) || !Number.isFinite(sourceY)) return null
  return Math.round(Math.atan2((sourceY as number) - playerY, (sourceX as number) - playerX) * 180 / Math.PI)
}

export function cycleFeedbackVolume(volume: FeedbackVolume): FeedbackVolume {
  if (volume === 0.6) return 1
  if (volume === 1) return 0
  return 0.6
}

export function normalizeCombatFeedbackSettings(value: unknown): CombatFeedbackSettings {
  if (!value || typeof value !== 'object') return { ...DEFAULT_COMBAT_FEEDBACK_SETTINGS }
  const candidate = value as Partial<CombatFeedbackSettings>
  const volume: FeedbackVolume = candidate.volume === 0 || candidate.volume === 0.6 || candidate.volume === 1
    ? candidate.volume
    : DEFAULT_COMBAT_FEEDBACK_SETTINGS.volume
  return {
    shake: typeof candidate.shake === 'boolean' ? candidate.shake : DEFAULT_COMBAT_FEEDBACK_SETTINGS.shake,
    flash: typeof candidate.flash === 'boolean' ? candidate.flash : DEFAULT_COMBAT_FEEDBACK_SETTINGS.flash,
    volume,
    muted: typeof candidate.muted === 'boolean' ? candidate.muted : DEFAULT_COMBAT_FEEDBACK_SETTINGS.muted,
  }
}
