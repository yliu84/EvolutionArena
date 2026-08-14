import { describe, expect, it } from 'vitest'
import {
  ELITE_AFFIX_IDS,
  absorbEliteShield,
  eliteAffixFor,
  eliteCooldownMultiplier,
  eliteDamageMultiplier,
  eliteSpeedMultiplier,
  initialEliteShield,
  shouldTriggerBrood,
  siphonHealth,
  toxicBurstHits,
} from '../src/elite-affixes'

describe('elite affixes', () => {
  it('assigns one deterministic modifier to each elite encounter', () => {
    expect(eliteAffixFor('same-run', 'guard-a')).toBe(eliteAffixFor('same-run', 'guard-a'))
    const sampled = new Set(Array.from({ length: 80 }, (_, index) => eliteAffixFor(`run-${index}`, `guard-${index}`)))
    expect(sampled).toEqual(new Set(ELITE_AFFIX_IDS))
  })

  it('activates berserker multipliers only at half health or lower', () => {
    expect(eliteSpeedMultiplier('berserker', 51, 100)).toBe(1)
    expect(eliteSpeedMultiplier('berserker', 50, 100)).toBe(1.3)
    expect(eliteCooldownMultiplier('berserker', 40, 100)).toBeLessThan(1)
    expect(eliteDamageMultiplier('berserker', 40, 100)).toBeGreaterThan(1)
    expect(eliteDamageMultiplier('barrier', 10, 100)).toBe(1)
  })

  it('absorbs damage with the barrier before health is reduced', () => {
    expect(initialEliteShield('barrier', 31)).toBe(10)
    expect(absorbEliteShield(7, 10)).toEqual({ absorbed: 7, remainingDamage: 0, remainingShield: 3 })
    expect(absorbEliteShield(12, 3)).toEqual({ absorbed: 3, remainingDamage: 9, remainingShield: 0 })
  })

  it('heals siphon elites without exceeding maximum health', () => {
    expect(siphonHealth('siphon', 10, 20, 8)).toBe(14)
    expect(siphonHealth('siphon', 19, 20, 8)).toBe(20)
    expect(siphonHealth('brood', 10, 20, 8)).toBe(10)
  })

  it('triggers brood once when health crosses the halfway point', () => {
    expect(shouldTriggerBrood('brood', 12, 10, 20, false)).toBe(true)
    expect(shouldTriggerBrood('brood', 10, 8, 20, false)).toBe(false)
    expect(shouldTriggerBrood('brood', 12, 10, 20, true)).toBe(false)
    expect(shouldTriggerBrood('brood', 12, 0, 20, false)).toBe(false)
  })

  it('uses an inclusive and readable toxic burst radius', () => {
    expect(toxicBurstHits(132)).toBe(true)
    expect(toxicBurstHits(133)).toBe(false)
  })
})
