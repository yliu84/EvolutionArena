import { describe, expect, it } from 'vitest'
import {
  COMBAT_JUICE,
  hitstopMsForImpact,
  juiceBurstMs,
  juiceProgress,
  shakeIntensityForImpact,
  sparkCountForImpact,
} from '../src/combat-juice'

describe('combat juice bar', () => {
  it('hitstops connected melee and magic harder than Warcraft unit splat timing, without freezing control', () => {
    expect(hitstopMsForImpact('melee', 1)).toBeGreaterThanOrEqual(48)
    expect(hitstopMsForImpact('melee', 1)).toBeLessThanOrEqual(80)
    expect(hitstopMsForImpact('magic', 2)).toBeGreaterThan(hitstopMsForImpact('melee', 1))
    expect(hitstopMsForImpact('magic', 2)).toBeLessThanOrEqual(80)
    expect(hitstopMsForImpact('melee', 0)).toBe(0)
    expect(hitstopMsForImpact('ranged', 0)).toBe(0)
    expect(COMBAT_JUICE.hitstopRangedConnectMs).toBeGreaterThanOrEqual(32)
    expect(COMBAT_JUICE.hitstopTimeScale).toBeGreaterThan(0)
    expect(COMBAT_JUICE.hitstopTimeScale).toBeLessThan(0.4)
  })

  it('keeps style bursts long enough to read, with magic lasting longest', () => {
    expect(juiceBurstMs('melee')).toBeGreaterThanOrEqual(240)
    expect(juiceBurstMs('magic')).toBeGreaterThan(juiceBurstMs('melee'))
    expect(juiceBurstMs('ranged')).toBeGreaterThanOrEqual(180)
    expect(juiceProgress(1000, 1000, 160)).toBe(0)
    expect(juiceProgress(1000, 1080, 160)).toBe(0.5)
    expect(juiceProgress(1000, 1200, 160)).toBe(1)
  })

  it('shakes less on a whiff than on a connect, and caps spark spam', () => {
    expect(shakeIntensityForImpact('melee', 1)).toBeGreaterThan(shakeIntensityForImpact('melee', 0))
    expect(shakeIntensityForImpact('magic', 1)).toBeLessThanOrEqual(0.008)
    expect(sparkCountForImpact('melee', 1)).toBeGreaterThan(sparkCountForImpact('melee', 0))
    expect(COMBAT_JUICE.maxActiveSparks).toBeLessThanOrEqual(48)
  })
})
