import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_3D_MOVE_FACING_TOLERANCE_DEGREES,
  gloamwoodMovementFacingRadians,
  gloamwoodScreenMovementVector,
  stepGloamwoodTurnBeforeMove,
} from '../src/gloamwood-3d-hunt'

describe('Gloamwood 3D turn-before-move gate', () => {
  it('maps all four world movement directions to the model forward axis', () => {
    expect(gloamwoodMovementFacingRadians(1, 0)).toBeCloseTo(0)
    expect(gloamwoodMovementFacingRadians(0, 1)).toBeCloseTo(-Math.PI / 2)
    expect(Math.abs(gloamwoodMovementFacingRadians(-1, 0))).toBeCloseTo(Math.PI)
    expect(gloamwoodMovementFacingRadians(0, -1)).toBeCloseTo(Math.PI / 2)
  })

  it('converts four-way controls into camera-relative screen directions', () => {
    const up = gloamwoodScreenMovementVector(0, -1)
    const down = gloamwoodScreenMovementVector(0, 1)
    const left = gloamwoodScreenMovementVector(-1, 0)
    const right = gloamwoodScreenMovementVector(1, 0)
    expect(up.x).toBeLessThan(0)
    expect(up.z).toBeLessThan(0)
    expect(right.x).toBeGreaterThan(0)
    expect(right.z).toBeLessThan(0)
    expect(left.x).toBeLessThan(0)
    expect(left.z).toBeGreaterThan(0)
    expect(down.x).toBeCloseTo(-up.x)
    expect(down.z).toBeCloseTo(-up.z)
    expect(left.x).toBeCloseTo(-right.x)
    expect(left.z).toBeCloseTo(-right.z)
    expect(Math.hypot(up.x, up.z)).toBeCloseTo(1)
    expect(Math.hypot(right.x, right.z)).toBeCloseTo(1)
    expect(up.x * right.x + up.z * right.z).toBeCloseTo(0)
  })

  it('blocks translation while a reverse direction is still turning', () => {
    const frame = stepGloamwoodTurnBeforeMove(0, Math.PI, 1 / 60)
    expect(frame.canTranslate).toBe(false)
    expect(frame.remainingErrorDegrees).toBeGreaterThan(GLOAMWOOD_3D_MOVE_FACING_TOLERANCE_DEGREES)
  })

  it('allows translation immediately when already facing the requested direction', () => {
    const frame = stepGloamwoodTurnBeforeMove(Math.PI / 3, Math.PI / 3, 1 / 60)
    expect(frame.canTranslate).toBe(true)
    expect(frame.remainingErrorDegrees).toBe(0)
  })

  it('finishes the turn before opening the translation gate', () => {
    let facing = -Math.PI * 0.75
    let frame = stepGloamwoodTurnBeforeMove(facing, Math.PI * 0.25, 1 / 60)
    let blockedFrames = 0
    while (!frame.canTranslate && blockedFrames < 180) {
      blockedFrames += 1
      facing = frame.facingRadians
      frame = stepGloamwoodTurnBeforeMove(facing, Math.PI * 0.25, 1 / 60)
    }
    expect(blockedFrames).toBeGreaterThan(0)
    expect(blockedFrames).toBeLessThan(180)
    expect(frame.remainingErrorDegrees).toBeLessThanOrEqual(GLOAMWOOD_3D_MOVE_FACING_TOLERANCE_DEGREES)
  })
})
