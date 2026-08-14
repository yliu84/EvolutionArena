import { describe, expect, it } from 'vitest'
import { MONSTERS, canDetectTarget, regenerateHealth, shouldDisengage } from '../src/monsters'

describe('monster perception and recovery', () => {
  it('detects targets inside the forward vision cone', () => {
    expect(canDetectTarget(300, 0.2, 0, MONSTERS.pouncer)).toBe(true)
    expect(canDetectTarget(300, Math.PI, 0, MONSTERS.pouncer)).toBe(false)
  })

  it('hears nearby targets even behind itself', () => {
    expect(canDetectTarget(MONSTERS.spitter.hearingRange - 1, Math.PI, 0, MONSTERS.spitter)).toBe(true)
  })

  it('disengages at either the leash or lost-target boundary', () => {
    expect(shouldDisengage(MONSTERS.shellback.leashRange + 1, 100, MONSTERS.shellback)).toBe(true)
    expect(shouldDisengage(100, MONSTERS.shellback.lostRange + 1, MONSTERS.shellback)).toBe(true)
    expect(shouldDisengage(100, 100, MONSTERS.shellback)).toBe(false)
  })

  it('regenerates by max-health percentage and never exceeds maximum', () => {
    expect(regenerateHealth(4, 10, 0.2, 1000)).toBe(6)
    expect(regenerateHealth(9, 10, 0.2, 1000)).toBe(10)
  })
})
