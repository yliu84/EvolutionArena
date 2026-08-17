import { describe, expect, it } from 'vitest'
import { gloamwoodJoystickVector } from '../src/gloamwood-touch-controls'

describe('Gloamwood virtual joystick', () => {
  it('ignores thumb jitter inside the dead zone', () => {
    expect(gloamwoodJoystickVector(3, 2, 38)).toMatchObject({ x: 0, z: 0, strength: 0 })
  })

  it('preserves continuous direction and partial strength', () => {
    const vector = gloamwoodJoystickVector(19, -19, 38)
    expect(vector.x).toBeGreaterThan(0.45)
    expect(vector.z).toBeLessThan(-0.45)
    expect(vector.strength).toBeGreaterThan(0.6)
    expect(vector.strength).toBeLessThan(0.7)
  })

  it('clamps movement and knob travel at the outer radius', () => {
    const vector = gloamwoodJoystickVector(200, 0, 38)
    expect(vector).toEqual({ x: 1, z: 0, visualX: 38, visualY: 0, strength: 1 })
  })
})
