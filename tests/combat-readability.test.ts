import { describe, expect, it } from 'vitest'
import {
  combatHealthTone,
  enemyReadabilityState,
  floatingIncomingDamageStyle,
  floatingOutgoingDamageStyle,
} from '../src/combat-readability'

describe('combat readability', () => {
  it('uses stable health thresholds', () => {
    expect(combatHealthTone(7, 10)).toBe('healthy')
    expect(combatHealthTone(6, 10)).toBe('wounded')
    expect(combatHealthTone(3, 10)).toBe('critical')
    expect(combatHealthTone(-2, 10)).toBe('critical')
  })

  it('turns attack timing into readable action states', () => {
    expect(enemyReadabilityState(8, 10, 'telegraph').statusLabel).toBe('预警')
    expect(enemyReadabilityState(8, 10, 'attack').statusTone).toBe('danger')
    expect(enemyReadabilityState(8, 10, 'recover').statusLabel).toBe('破绽')
    expect(enemyReadabilityState(8, 10, 'brace').statusColor).toBe(0x78dcff)
  })

  it('keeps passive labels quiet except for elites', () => {
    expect(enemyReadabilityState(8, 10, 'pursue').showStatus).toBe(false)
    expect(enemyReadabilityState(8, 10, 'pursue', true).statusLabel).toBe('精英')
    expect(enemyReadabilityState(8, 10, 'pursue', true).showStatus).toBe(true)
  })

  it('distinguishes outgoing styles, armor and kills', () => {
    expect(floatingOutgoingDamageStyle('ranged').color).toBe('#8fe5ff')
    expect(floatingOutgoingDamageStyle('magic').color).toBe('#d8a2ff')
    expect(floatingOutgoingDamageStyle('melee', false, true).prefix).toBe('护甲 ')
    expect(floatingOutgoingDamageStyle('melee', true).fontSize).toBeGreaterThan(18)
  })

  it('distinguishes incoming hit sources and lethal hits', () => {
    expect(floatingIncomingDamageStyle('contact').prefix).toBe('−')
    expect(floatingIncomingDamageStyle('area').color).toBe('#d8a2ff')
    expect(floatingIncomingDamageStyle('ranged', true).prefix).toBe('致命 ')
  })
})
