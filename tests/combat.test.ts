import { describe, expect, it } from 'vitest'
import {
  COMBAT_STYLES,
  ATTACK_BUFFER_MS,
  PLAYER_PROJECTILE_SPEED,
  attackDamage,
  attackBufferExpiresAt,
  clampAttackPoint,
  isInsideMeleeArc,
  isAttackBufferAlive,
  isWithinAttackRange,
  projectileLifetimeMs,
} from '../src/combat'

describe('player combat styles', () => {
  it('keeps every damaging style telegraphed and recoverable', () => {
    for (const style of Object.values(COMBAT_STYLES)) {
      expect(style.telegraphMs).toBeGreaterThanOrEqual(100)
      expect(style.recoveryMs).toBeGreaterThanOrEqual(100)
      expect(style.cooldownMs).toBeGreaterThanOrEqual(style.telegraphMs + style.recoveryMs)
    }
  })

  it('gives melee and magic a damage premium', () => {
    expect(attackDamage('melee', 1)).toBe(2)
    expect(attackDamage('ranged', 1)).toBe(1)
    expect(attackDamage('magic', 1)).toBe(2)
    expect(attackDamage('melee', 1, 1.25)).toBe(2.5)
  })

  it('enforces distinct attack ranges', () => {
    expect(isWithinAttackRange('melee', 119)).toBe(false)
    expect(isWithinAttackRange('ranged', 390)).toBe(true)
    expect(isWithinAttackRange('ranged', 391)).toBe(false)
    expect(isWithinAttackRange('magic', 431)).toBe(false)
  })

  it('clamps ground magic to cast range', () => {
    expect(clampAttackPoint(0, 0, 300, 400, 250)).toEqual({ x: 150, y: 200 })
  })

  it('hits only targets inside the forward melee arc', () => {
    expect(isInsideMeleeArc(0, 0, 0, 100, 20, 118)).toBe(true)
    expect(isInsideMeleeArc(0, 0, 0, -80, 0, 118)).toBe(false)
    expect(isInsideMeleeArc(0, 0, 0, 140, 0, 118)).toBe(false)
  })

  it('keeps a short attack input buffer without hiding long mistakes', () => {
    const expiresAt = attackBufferExpiresAt(1000)
    expect(expiresAt).toBe(1000 + ATTACK_BUFFER_MS)
    expect(isAttackBufferAlive(1140, expiresAt)).toBe(true)
    expect(isAttackBufferAlive(1141, expiresAt)).toBe(false)
  })

  it('keeps ranged fire deliberate and prevents bullets exceeding effective range', () => {
    expect(COMBAT_STYLES.ranged.cooldownMs).toBeGreaterThanOrEqual(500)
    expect(COMBAT_STYLES.ranged.range).toBeLessThan(COMBAT_STYLES.magic.range)
    const lifetime = projectileLifetimeMs(COMBAT_STYLES.ranged.range, PLAYER_PROJECTILE_SPEED)
    expect(PLAYER_PROJECTILE_SPEED * Math.max(0, lifetime - 40) / 1000).toBeCloseTo(COMBAT_STYLES.ranged.range, 0)
  })
})
