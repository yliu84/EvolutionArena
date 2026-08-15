import { describe, expect, it } from 'vitest'
import { RIFT_WARDEN, bossCooldown, bossFailureOutcome, bossPatternForTurn, bossPhase } from '../src/boss'

describe('rift warden boss', () => {
  it('telegraphs every damaging pattern for at least 650ms', () => {
    for (const pattern of Object.values(RIFT_WARDEN.patterns)) {
      expect(pattern.telegraphMs).toBeGreaterThanOrEqual(650)
      expect(pattern.recoveryMs).toBeGreaterThanOrEqual(700)
      expect(pattern.damage).toBeGreaterThan(0)
    }
  })

  it('changes phase at half health', () => {
    expect(bossPhase(RIFT_WARDEN.maxHealth)).toBe(1)
    expect(bossPhase(RIFT_WARDEN.maxHealth / 2 + 1)).toBe(1)
    expect(bossPhase(RIFT_WARDEN.maxHealth / 2)).toBe(2)
  })

  it('uses deterministic readable attack rotations', () => {
    expect([0, 1, 2].map((turn) => bossPatternForTurn(turn, 1))).toEqual([
      'shockwave', 'ember-volley', 'rift-charge',
    ])
    expect([0, 1, 2, 3].map((turn) => bossPatternForTurn(turn, 2))).toEqual([
      'rift-charge', 'ember-volley', 'shockwave', 'ember-volley',
    ])
  })

  it('accelerates in phase two without removing telegraphs', () => {
    expect(bossCooldown(2)).toBeLessThan(bossCooldown(1))
  })

  it('ends the run when the player dies during the boss fight', () => {
    expect(bossFailureOutcome()).toBe('death')
  })
})
