import { describe, expect, it } from 'vitest'
import { playerAnimationPose, resolvePlayerAnimationState, type PlayerAnimationInput } from '../src/player-animation'

const base: PlayerAnimationInput = {
  now: 1000,
  runOver: false,
  health: 90,
  movementState: 'normal',
  movementRemainingMs: 0,
  speed: 0,
  attackStyle: null,
  attackWindupRemainingMs: 0,
  attackRecoverRemainingMs: 0,
  consumeRemainingMs: 0,
}

describe('player animation state', () => {
  it('uses gameplay-safe priority for terminal and interrupt states', () => {
    expect(resolvePlayerAnimationState({ ...base, runOver: true, health: 0, movementState: 'hitstun', consumeRemainingMs: 200 })).toBe('death')
    expect(resolvePlayerAnimationState({ ...base, movementState: 'hitstun', consumeRemainingMs: 200, attackStyle: 'melee' })).toBe('hit')
    expect(resolvePlayerAnimationState({ ...base, consumeRemainingMs: 200, attackStyle: 'magic' })).toBe('consume')
  })

  it('distinguishes three combat poses', () => {
    const melee = playerAnimationPose({ ...base, attackStyle: 'melee', attackWindupRemainingMs: 40 })
    const ranged = playerAnimationPose({ ...base, attackStyle: 'ranged', attackRecoverRemainingMs: 120 })
    const magic = playerAnimationPose({ ...base, attackStyle: 'magic', attackWindupRemainingMs: 100 })
    expect(melee.state).toBe('attack-melee')
    expect(melee.forwardOffset).toBeGreaterThan(0)
    expect(ranged.state).toBe('attack-ranged')
    expect(ranged.forwardOffset).toBeLessThan(0)
    expect(magic.state).toBe('attack-magic')
    expect(magic.sideScale).toBeGreaterThan(1)
  })

  it('separates idle, move and dodge silhouettes', () => {
    expect(resolvePlayerAnimationState(base)).toBe('idle')
    expect(resolvePlayerAnimationState({ ...base, speed: 120 })).toBe('move')
    expect(resolvePlayerAnimationState({ ...base, movementState: 'dodge' })).toBe('dodge')
    expect(playerAnimationPose({ ...base, movementState: 'dodge' }).sideScale).toBeLessThan(0.9)
  })

  it('collapses the body for death and dips the head while consuming', () => {
    expect(playerAnimationPose({ ...base, runOver: true, health: 0 }).sideScale).toBeLessThan(0.5)
    expect(playerAnimationPose({ ...base, consumeRemainingMs: 230 }).headDip).toBeGreaterThan(0)
  })
})
