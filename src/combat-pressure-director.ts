import type { MonsterAttackKind } from './monsters'

export type CombatThreatLane = 'contact' | 'ranged' | 'area'
export type CombatThreatPhase = 'telegraph' | 'attack' | 'brace'

export interface ActiveCombatThreat {
  id: string
  lane: CombatThreatLane
  phase: CombatThreatPhase
  elite: boolean
}

export interface CombatPressureDecisionInput {
  now: number
  lastThreatStartedAt: number
  playerHealthRatio: number
  candidate: Pick<ActiveCombatThreat, 'id' | 'lane' | 'elite'>
  activeThreats: ActiveCombatThreat[]
}

export type CombatPressureBlockReason =
  | 'start-gap'
  | 'telegraph-capacity'
  | 'threat-capacity'
  | 'same-lane'
  | 'pressure-budget'

interface CombatPressureDecisionBase {
  usedBudget: number
  budget: number
}

export type CombatPressureDecision = CombatPressureDecisionBase & (
  | { allowed: true; reason: 'ready'; retryAfterMs: 0 }
  | { allowed: false; reason: CombatPressureBlockReason; retryAfterMs: number }
)

export const COMBAT_PRESSURE_RULES = {
  criticalHealthRatio: 0.35,
  normalBudget: 3,
  criticalBudget: 3,
  normalThreatCapacity: 2,
  criticalThreatCapacity: 1,
  minStartGapMs: 420,
  criticalStartGapMs: 650,
  maxSimultaneousTelegraphs: 1,
} as const

export function combatThreatLane(attackKind: MonsterAttackKind): CombatThreatLane {
  if (attackKind === 'projectile') return 'ranged'
  if (attackKind === 'brace' || attackKind === 'spread') return 'area'
  return 'contact'
}

export function combatThreatCost(threat: Pick<ActiveCombatThreat, 'lane' | 'elite'>) {
  return (threat.lane === 'area' ? 2 : 1) + (threat.elite ? 1 : 0)
}

export function combatPressureBudget(playerHealthRatio: number) {
  return playerHealthRatio <= COMBAT_PRESSURE_RULES.criticalHealthRatio
    ? COMBAT_PRESSURE_RULES.criticalBudget
    : COMBAT_PRESSURE_RULES.normalBudget
}

export function combatPressureUsed(activeThreats: ActiveCombatThreat[]) {
  return activeThreats.reduce((total, threat) => total + combatThreatCost(threat), 0)
}

export function combatThreatRetryDelay(id: string) {
  let hash = 0
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return 140 + hash % 121
}

export function canStartCombatThreat(input: CombatPressureDecisionInput): CombatPressureDecision {
  const critical = input.playerHealthRatio <= COMBAT_PRESSURE_RULES.criticalHealthRatio
  const budget = combatPressureBudget(input.playerHealthRatio)
  const usedBudget = combatPressureUsed(input.activeThreats)
  const retryAfterMs = combatThreatRetryDelay(input.candidate.id)
  const startGap = critical ? COMBAT_PRESSURE_RULES.criticalStartGapMs : COMBAT_PRESSURE_RULES.minStartGapMs

  if (input.now - input.lastThreatStartedAt < startGap) {
    return { allowed: false, reason: 'start-gap', retryAfterMs, usedBudget, budget }
  }
  if (input.activeThreats.filter((threat) => threat.phase === 'telegraph').length >= COMBAT_PRESSURE_RULES.maxSimultaneousTelegraphs) {
    return { allowed: false, reason: 'telegraph-capacity', retryAfterMs, usedBudget, budget }
  }
  const threatCapacity = critical ? COMBAT_PRESSURE_RULES.criticalThreatCapacity : COMBAT_PRESSURE_RULES.normalThreatCapacity
  if (input.activeThreats.length >= threatCapacity) {
    return { allowed: false, reason: 'threat-capacity', retryAfterMs, usedBudget, budget }
  }
  if (input.activeThreats.some((threat) => threat.lane === input.candidate.lane)) {
    return { allowed: false, reason: 'same-lane', retryAfterMs, usedBudget, budget }
  }
  if (usedBudget + combatThreatCost(input.candidate) > budget) {
    return { allowed: false, reason: 'pressure-budget', retryAfterMs, usedBudget, budget }
  }
  return { allowed: true, reason: 'ready', retryAfterMs: 0, usedBudget, budget }
}
