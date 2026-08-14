import { describe, expect, it } from 'vitest'
import {
  DODGE,
  canStartDodge,
  directionToMoveTarget,
  dodgeCooldownRemaining,
  resolveDodgeDirection,
} from '../src/player-movement'

describe('player dodge and hit response', () => {
  it('normalizes diagonal dodge input', () => {
    const direction = resolveDodgeDirection(1, 1, 0)
    expect(direction.x).toBeCloseTo(Math.SQRT1_2)
    expect(direction.y).toBeCloseTo(Math.SQRT1_2)
  })

  it('uses facing direction when there is no movement input', () => {
    const direction = resolveDodgeDirection(0, 0, Math.PI / 2)
    expect(direction.x).toBeCloseTo(0)
    expect(direction.y).toBeCloseTo(1)
  })

  it('allows dodge only when normal and off cooldown', () => {
    expect(canStartDodge(1000, 1000, 'normal')).toBe(true)
    expect(canStartDodge(999, 1000, 'normal')).toBe(false)
    expect(canStartDodge(1200, 1000, 'hitstun')).toBe(false)
  })

  it('defines a short committed invulnerability window', () => {
    expect(DODGE.durationMs).toBeGreaterThanOrEqual(180)
    expect(DODGE.durationMs).toBeLessThanOrEqual(260)
    expect(DODGE.cooldownMs).toBeGreaterThan(DODGE.durationMs * 3)
    expect(dodgeCooldownRemaining(1300, 1800)).toBe(500)
    expect(dodgeCooldownRemaining(1900, 1800)).toBe(0)
  })

  it('moves toward a clicked ground point and stops close to it', () => {
    expect(directionToMoveTarget(0, 0, { x: 30, y: 40 })).toEqual({ x: 0.6, y: 0.8 })
    expect(directionToMoveTarget(20, 20, { x: 25, y: 25 })).toBeUndefined()
    expect(directionToMoveTarget(0, 0, undefined)).toBeUndefined()
  })
})
