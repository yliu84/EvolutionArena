import { describe, expect, it } from 'vitest'
import {
  STARTER_ORDER,
  STARTER_VARIANTS,
  isStarterVariantId,
  mitigateDamage,
  randomStarter,
} from '../src/starter-variants'

describe('starter variants', () => {
  it('offers one starter for every combat style without locking other styles', () => {
    expect(STARTER_ORDER.map((id) => STARTER_VARIANTS[id].startingStyle)).toEqual(['melee', 'ranged', 'magic'])
    for (const id of STARTER_ORDER) {
      expect(Object.keys(STARTER_VARIANTS[id].damageMultiplier)).toEqual(['melee', 'ranged', 'magic'])
    }
  })

  it('gives every starter a distinct survivability and movement profile', () => {
    expect(new Set(STARTER_ORDER.map((id) => STARTER_VARIANTS[id].maxHealth)).size).toBe(3)
    expect(new Set(STARTER_ORDER.map((id) => STARTER_VARIANTS[id].defenseReduction)).size).toBe(3)
    expect(new Set(STARTER_ORDER.map((id) => STARTER_VARIANTS[id].speed)).size).toBe(3)
  })

  it('caps defense and always leaves at least one damage', () => {
    expect(mitigateDamage(16, 0.12)).toBe(14)
    expect(mitigateDamage(16, 0.05)).toBe(15)
    expect(mitigateDamage(1, 0.9)).toBe(1)
  })

  it('supports deterministic random and query-string selection', () => {
    expect(randomStarter(() => 0)).toBe('claw-hunter')
    expect(randomStarter(() => 0.5)).toBe('spine-stalker')
    expect(randomStarter(() => 0.999)).toBe('rift-larva')
    expect(isStarterVariantId('rift-larva')).toBe(true)
    expect(isStarterVariantId('unknown')).toBe(false)
  })
})
