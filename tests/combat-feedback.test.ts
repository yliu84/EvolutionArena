import { describe, expect, it } from 'vitest'
import {
  autoLockPulse,
  healthRatio,
  isTalentSignalActive,
  shouldAutoLockAttacker,
  shouldShowEnemyHealthBar,
} from '../src/combat-feedback'

describe('combat feedback visibility', () => {
  it('clamps health bars and hides peaceful full-health enemies', () => {
    expect(healthRatio(5, 10)).toBe(0.5)
    expect(healthRatio(-2, 10)).toBe(0)
    expect(healthRatio(15, 10)).toBe(1)
    expect(shouldShowEnemyHealthBar(true, true, 'idle', 10, 10, false)).toBe(false)
    expect(shouldShowEnemyHealthBar(true, true, 'pursue', 10, 10, false)).toBe(true)
    expect(shouldShowEnemyHealthBar(true, true, 'idle', 10, 10, true)).toBe(true)
    expect(shouldShowEnemyHealthBar(true, false, 'attack', 5, 10, true)).toBe(false)
  })

  it('expires talent signals and the retaliation pulse predictably', () => {
    expect(isTalentSignalActive('wing', 1200, 1000)).toBe(true)
    expect(isTalentSignalActive('wing', 1400, 1000)).toBe(false)
    expect(autoLockPulse(1300, 1000)).toBeCloseTo(2 / 3)
    expect(autoLockPulse(2000, 1000)).toBe(0)
  })

  it('does not steal a visible lock when a different monster hits the player', () => {
    expect(shouldAutoLockAttacker(false, false)).toBe(true)
    expect(shouldAutoLockAttacker(true, true)).toBe(true)
    expect(shouldAutoLockAttacker(true, false)).toBe(false)
  })
})
