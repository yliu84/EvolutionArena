import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_3D_LOCOMOTION_FEEL,
  createGloamwoodFootstepState,
  gloamwoodWeightFrame,
  stepGloamwoodFootsteps,
} from '../src/gloamwood-3d-locomotion'

describe('Gloamwood weighted locomotion feedback', () => {
  it('keeps the heavy body cadence below three visible foot plants per second', () => {
    expect(GLOAMWOOD_3D_LOCOMOTION_FEEL.runCyclesPerSecond * 2).toBeCloseTo(2.56)
    expect(GLOAMWOOD_3D_LOCOMOTION_FEEL.runCyclesPerSecond * 2).toBeLessThan(3)
  })

  it('emits alternating discrete foot plants only after locomotion has blended in', () => {
    const state = createGloamwoodFootstepState()
    expect(stepGloamwoodFootsteps(state, 0, 0.2).emitted).toBe(false)
    expect(stepGloamwoodFootsteps(state, Math.PI * 0.9, 1)).toEqual({ emitted: true, side: 1 })
    expect(stepGloamwoodFootsteps(state, Math.PI * 1.1, 1).emitted).toBe(false)
    expect(stepGloamwoodFootsteps(state, Math.PI * 1.9, 1)).toEqual({ emitted: true, side: -1 })
  })

  it('creates a stronger planted compression than the airborne lift', () => {
    const planted = gloamwoodWeightFrame(0, 1, 1)
    const lifted = gloamwoodWeightFrame(Math.PI / 2, 1, 0)
    expect(planted.contact).toBe(1)
    expect(planted.yOffset).toBeLessThan(-0.09)
    expect(lifted.contact).toBeLessThan(0.001)
    expect(lifted.yOffset).toBeGreaterThan(0.05)
  })

  it('returns to a neutral resting frame when movement blend reaches zero', () => {
    expect(gloamwoodWeightFrame(1.2, 0, 0)).toMatchObject({ contact: 0, compression: 0, yOffset: 0, bodyRock: 0 })
  })
})
