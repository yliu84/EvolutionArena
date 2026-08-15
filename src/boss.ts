export type BossPattern = 'shockwave' | 'ember-volley' | 'rift-charge'
export type BossState = 'dormant' | 'recover' | 'telegraph' | 'attack' | 'defeated'

export interface BossDefinition {
  id: 'rift-warden'
  name: string
  maxHealth: number
  phaseTwoThreshold: number
  contactDamage: number
  patterns: Record<BossPattern, {
    telegraphMs: number
    activeMs: number
    recoveryMs: number
    damage: number
  }>
}

export const RIFT_WARDEN: BossDefinition = {
  id: 'rift-warden',
  name: '裂隙守望者',
  maxHealth: 72,
  phaseTwoThreshold: 0.5,
  contactDamage: 16,
  patterns: {
    shockwave: { telegraphMs: 950, activeMs: 140, recoveryMs: 820, damage: 22 },
    'ember-volley': { telegraphMs: 800, activeMs: 120, recoveryMs: 760, damage: 14 },
    'rift-charge': { telegraphMs: 700, activeMs: 420, recoveryMs: 900, damage: 24 },
  },
}

const PHASE_ONE: readonly BossPattern[] = ['shockwave', 'ember-volley', 'rift-charge']
const PHASE_TWO: readonly BossPattern[] = ['rift-charge', 'ember-volley', 'shockwave', 'ember-volley']

export function bossPhase(health: number, maxHealth = RIFT_WARDEN.maxHealth): 1 | 2 {
  return health <= maxHealth * RIFT_WARDEN.phaseTwoThreshold ? 2 : 1
}

export function bossPatternForTurn(turn: number, phase: 1 | 2): BossPattern {
  const sequence = phase === 1 ? PHASE_ONE : PHASE_TWO
  return sequence[Math.abs(turn) % sequence.length]
}

export function bossCooldown(phase: 1 | 2): number {
  return phase === 1 ? 900 : 520
}

export function bossFailureOutcome(): 'death' {
  return 'death'
}
