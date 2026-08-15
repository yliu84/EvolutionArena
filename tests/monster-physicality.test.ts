import { describe, expect, it } from 'vitest'
import { MONSTER_TYPES } from '../src/monsters'
import {
  MONSTER_PHYSICAL_PROFILES,
  isFlyingMonster,
  monsterCanContactPlayer,
  monsterColliderOffset,
  monsterDisplayScale,
  monsterTerrainCollisionEnabled,
} from '../src/monster-physicality'

describe('monster physicality', () => {
  it('classifies and scales every monster in the roster', () => {
    expect(Object.keys(MONSTER_PHYSICAL_PROFILES).sort()).toEqual([...MONSTER_TYPES].sort())
    for (const type of MONSTER_TYPES) {
      const profile = MONSTER_PHYSICAL_PROFILES[type]
      expect(profile.baseScale).toBeGreaterThanOrEqual(0.6)
      expect(profile.baseScale).toBeLessThanOrEqual(1.4)
      expect(profile.colliderRadius).toBeGreaterThanOrEqual(14)
      expect(monsterDisplayScale(type, true)).toBeGreaterThan(monsterDisplayScale(type))
      expect(profile.locomotion === 'flying' ? profile.hoverHeight : 0).toBe(profile.hoverHeight)
    }
  })

  it('keeps ground monsters blocked by terrain at all times', () => {
    for (const type of MONSTER_TYPES.filter((candidate) => !isFlyingMonster(candidate))) {
      expect(monsterTerrainCollisionEnabled(type, 0)).toBe(true)
      expect(monsterTerrainCollisionEnabled(type, 100)).toBe(true)
    }
  })

  it('centers every collision circle under the authored creature origin', () => {
    for (const type of MONSTER_TYPES) {
      const sourceSize = ['pouncer', 'razorwing', 'shellback', 'bloodleech', 'spitter', 'riftweaver'].includes(type) ? 313 : 96
      const offset = monsterColliderOffset(type, sourceSize)
      const radius = MONSTER_PHYSICAL_PROFILES[type].colliderRadius
      expect(offset.x + radius).toBeCloseTo(sourceSize * 0.5)
      expect(offset.y + radius).toBeCloseTo(sourceSize * 0.68)
    }
  })

  it('lets flying monsters cross walls aloft but requires a completed dive for contact damage', () => {
    for (const type of MONSTER_TYPES.filter(isFlyingMonster)) {
      expect(monsterTerrainCollisionEnabled(type, MONSTER_PHYSICAL_PROFILES[type].hoverHeight)).toBe(false)
      expect(monsterTerrainCollisionEnabled(type, 0)).toBe(true)
      expect(monsterCanContactPlayer(type, MONSTER_PHYSICAL_PROFILES[type].hoverHeight, 'attack')).toBe(false)
    }
    expect(monsterCanContactPlayer('razorwing', 0, 'attack')).toBe(true)
    expect(monsterCanContactPlayer('razorwing', 0, 'telegraph')).toBe(false)
    expect(monsterCanContactPlayer('moth', 0, 'attack')).toBe(false)
  })
})
