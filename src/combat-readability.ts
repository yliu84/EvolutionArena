import type { CombatStyle } from './combat'
import type { IncomingHitKind } from './player-hit-feedback'

export type CombatHealthTone = 'healthy' | 'wounded' | 'critical'
export type CombatStateTone = 'neutral' | 'warning' | 'danger' | 'opportunity'

export interface EnemyReadabilityState {
  healthRatio: number
  healthTone: CombatHealthTone
  healthColor: number
  statusLabel: string
  statusTone: CombatStateTone
  statusColor: number
  showStatus: boolean
}

export interface FloatingDamageStyle {
  color: string
  prefix: string
  fontSize: number
  rise: number
  durationMs: number
}

const HEALTH_COLORS: Record<CombatHealthTone, number> = {
  healthy: 0x79f2a1,
  wounded: 0xffc857,
  critical: 0xff7058,
}

const STATE_PRESENTATION: Record<string, { label: string; tone: CombatStateTone; color: number }> = {
  telegraph: { label: '预警', tone: 'warning', color: 0xffc857 },
  attack: { label: '危险', tone: 'danger', color: 0xff7058 },
  brace: { label: '防御', tone: 'danger', color: 0x78dcff },
  recover: { label: '破绽', tone: 'opportunity', color: 0x79f2a1 },
}

export function combatHealthTone(hp: number, maxHp: number): CombatHealthTone {
  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0
  if (ratio <= 0.3) return 'critical'
  if (ratio <= 0.6) return 'wounded'
  return 'healthy'
}

export function enemyReadabilityState(
  hp: number,
  maxHp: number,
  aiState: string,
  elite = false,
  selected = false,
): EnemyReadabilityState {
  const healthRatio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0
  const healthTone = combatHealthTone(hp, maxHp)
  const presentation = STATE_PRESENTATION[aiState] ?? {
    label: elite ? '精英' : '', tone: 'neutral' as const, color: elite ? 0xffd982 : 0xcde8d5,
  }
  return {
    healthRatio,
    healthTone,
    healthColor: HEALTH_COLORS[healthTone],
    statusLabel: presentation.label,
    statusTone: presentation.tone,
    statusColor: presentation.color,
    showStatus: Boolean(presentation.label) && (elite || selected || aiState in STATE_PRESENTATION),
  }
}

export function floatingOutgoingDamageStyle(
  style: CombatStyle,
  killed = false,
  mitigated = false,
): FloatingDamageStyle {
  const color = mitigated ? '#9fb7c6' : style === 'melee' ? '#ffd37a' : style === 'magic' ? '#d8a2ff' : '#8fe5ff'
  return {
    color,
    prefix: killed ? '✦ ' : mitigated ? '护甲 ' : '',
    fontSize: killed ? 22 : 17,
    rise: killed ? 58 : 42,
    durationMs: killed ? 760 : 620,
  }
}

export function floatingIncomingDamageStyle(kind: IncomingHitKind, lethal = false): FloatingDamageStyle {
  const color = kind === 'ranged' ? '#8fe5ff' : kind === 'area' ? '#d8a2ff' : kind === 'environment' ? '#b8ef7c' : '#ff8068'
  return {
    color,
    prefix: lethal ? '致命 ' : '−',
    fontSize: lethal ? 22 : 18,
    rise: lethal ? 54 : 40,
    durationMs: lethal ? 800 : 650,
  }
}
