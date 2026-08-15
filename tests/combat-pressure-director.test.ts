import { describe, expect, it } from 'vitest'
import {
  COMBAT_PRESSURE_RULES,
  canStartCombatThreat,
  combatPressureBudget,
  combatThreatLane,
  combatThreatRetryDelay,
  type ActiveCombatThreat,
} from '../src/combat-pressure-director'

const threat = (overrides: Partial<ActiveCombatThreat> = {}): ActiveCombatThreat => ({
  id: 'pouncer-1', lane: 'contact', phase: 'attack', elite: false, ...overrides,
})

describe('combat pressure director', () => {
  it('maps monster attacks into readable pressure lanes', () => {
    expect(combatThreatLane('pounce')).toBe('contact')
    expect(combatThreatLane('dash')).toBe('contact')
    expect(combatThreatLane('drain')).toBe('contact')
    expect(combatThreatLane('projectile')).toBe('ranged')
    expect(combatThreatLane('brace')).toBe('area')
    expect(combatThreatLane('spread')).toBe('area')
  })

  it('allows the first threat when the arena is quiet', () => {
    expect(canStartCombatThreat({
      now: 2000,
      lastThreatStartedAt: 0,
      playerHealthRatio: 1,
      candidate: threat(),
      activeThreats: [],
    }).allowed).toBe(true)
  })

  it('spaces new attack starts and permits a different lane after the gap', () => {
    const activeThreats = [threat()]
    const candidate = threat({ id: 'spitter-1', lane: 'ranged' })
    expect(canStartCombatThreat({
      now: 2300, lastThreatStartedAt: 2000, playerHealthRatio: 1, candidate, activeThreats,
    }).reason).toBe('start-gap')
    expect(canStartCombatThreat({
      now: 2500, lastThreatStartedAt: 2000, playerHealthRatio: 1, candidate, activeThreats,
    }).allowed).toBe(true)
  })

  it('never stacks two telegraphs or two threats from the same lane', () => {
    const candidate = threat({ id: 'spitter-1', lane: 'ranged' })
    expect(canStartCombatThreat({
      now: 3000,
      lastThreatStartedAt: 0,
      playerHealthRatio: 1,
      candidate,
      activeThreats: [threat({ phase: 'telegraph' })],
    }).reason).toBe('telegraph-capacity')
    expect(canStartCombatThreat({
      now: 3000,
      lastThreatStartedAt: 0,
      playerHealthRatio: 1,
      candidate: threat({ id: 'pouncer-2' }),
      activeThreats: [threat()],
    }).reason).toBe('same-lane')
  })

  it('reserves more pressure budget for area attacks and elite monsters', () => {
    expect(canStartCombatThreat({
      now: 3000,
      lastThreatStartedAt: 0,
      playerHealthRatio: 1,
      candidate: threat({ id: 'elite-shellback', lane: 'area', elite: true }),
      activeThreats: [threat({ id: 'spitter', lane: 'ranged' })],
    }).reason).toBe('pressure-budget')
  })

  it('reduces concurrent pressure when the player reaches critical health', () => {
    expect(combatPressureBudget(COMBAT_PRESSURE_RULES.criticalHealthRatio)).toBe(COMBAT_PRESSURE_RULES.criticalBudget)
    expect(canStartCombatThreat({
      now: 3000,
      lastThreatStartedAt: 0,
      playerHealthRatio: 0.25,
      candidate: threat({ id: 'spitter-1', lane: 'ranged' }),
      activeThreats: [threat()],
    }).reason).toBe('threat-capacity')
  })

  it('still lets a lone elite area monster attack a critical-health player', () => {
    expect(canStartCombatThreat({
      now: 3000,
      lastThreatStartedAt: 0,
      playerHealthRatio: 0.25,
      candidate: threat({ id: 'elite-shellback', lane: 'area', elite: true }),
      activeThreats: [],
    }).allowed).toBe(true)
  })

  it('uses stable per-monster retry delays to avoid lockstep retries', () => {
    const first = combatThreatRetryDelay('wave-1-pouncer')
    expect(first).toBe(combatThreatRetryDelay('wave-1-pouncer'))
    expect(first).toBeGreaterThanOrEqual(140)
    expect(first).toBeLessThanOrEqual(260)
    expect(combatThreatRetryDelay('wave-1-spitter')).not.toBe(first)
  })
})
