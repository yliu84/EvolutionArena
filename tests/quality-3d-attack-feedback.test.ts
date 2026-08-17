import { describe, expect, it } from 'vitest'

import { QUALITY_3D_ATTACK_FEEDBACK } from '../src/quality-3d-attack-feedback'

describe('quality 3D basic attack feedback', () => {
  it('gives claw, bite, pounce, and tail contact distinct silhouettes and timing', () => {
    const { Claw, Bite, Pounce, TailSwipe } = QUALITY_3D_ATTACK_FEEDBACK
    expect(Claw.arcCount).toBe(2)
    expect(Pounce.arcCount).toBe(2)
    expect(Pounce.scale).toBeGreaterThan(Claw.scale)
    expect(Pounce.hitStopSeconds).toBeGreaterThan(Claw.hitStopSeconds)
    expect(Bite.scale).toBeLessThan(Claw.scale)
    expect(TailSwipe.plane).toBe('ground')
    expect(new Set([Claw.durationSeconds, Bite.durationSeconds, Pounce.durationSeconds, TailSwipe.durationSeconds]).size).toBe(4)
  })

  it('keeps hit stop brief enough for a responsive single-button combo', () => {
    for (const recipe of Object.values(QUALITY_3D_ATTACK_FEEDBACK)) {
      expect(recipe.hitStopSeconds).toBeGreaterThan(0.03)
      expect(recipe.hitStopSeconds).toBeLessThanOrEqual(0.11)
    }
  })
})
