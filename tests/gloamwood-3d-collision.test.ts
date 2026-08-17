import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_PLAYER_COLLISION_PROFILES,
  getGloamwoodPlayerCollisionProfile,
  inspectGloamwoodPlayerCollision,
  resolveGloamwoodPlayerCollision,
  type GloamwoodCircleObstacle,
} from '../src/gloamwood-3d-collision'

const rock: GloamwoodCircleObstacle = { id: 'rock-0', kind: 'rock', x: 0, z: 0, radius: 1.25 }

describe('Gloamwood 3D world collision', () => {
  it('grows the collision footprint with each visible evolution stage', () => {
    expect(GLOAMWOOD_PLAYER_COLLISION_PROFILES[1].radius).toBeGreaterThan(GLOAMWOOD_PLAYER_COLLISION_PROFILES[0].radius)
    expect(GLOAMWOOD_PLAYER_COLLISION_PROFILES[2].frontOffset).toBeGreaterThan(GLOAMWOOD_PLAYER_COLLISION_PROFILES[1].frontOffset)
    expect(GLOAMWOOD_PLAYER_COLLISION_PROFILES[2].rearOffset).toBeGreaterThan(GLOAMWOOD_PLAYER_COLLISION_PROFILES[1].rearOffset)
    expect(getGloamwoodPlayerCollisionProfile(99)).toBe(GLOAMWOOD_PLAYER_COLLISION_PROFILES[2])
  })

  it('keeps the long stage-two chest and rear body outside a rock', () => {
    const result = resolveGloamwoodPlayerCollision({ x: 0.9, z: 0 }, 0, 2, [rock])
    const inspection = inspectGloamwoodPlayerCollision(result, 0, 2, [rock])
    expect(result.contacts).toBeGreaterThan(0)
    expect(inspection.minimumClearance).toBeGreaterThanOrEqual(-0.00001)
  })

  it('rotates the three-probe footprint with the character facing', () => {
    const result = resolveGloamwoodPlayerCollision({ x: 0, z: 1 }, Math.PI / 2, 2, [rock])
    expect(result.contacts).toBeGreaterThan(0)
    expect(result.minimumClearance).toBeGreaterThanOrEqual(-0.00001)
  })

  it('pushes a character out even when a probe is exactly at an obstacle center', () => {
    const result = resolveGloamwoodPlayerCollision({ x: 0, z: 0 }, 0, 0, [rock])
    expect(result.contacts).toBeGreaterThan(0)
    expect(Math.hypot(result.x, result.z)).toBeGreaterThan(0)
    expect(result.minimumClearance).toBeGreaterThanOrEqual(-0.00001)
  })

  it('iterates through clustered obstacles instead of resolving only the first overlap', () => {
    const obstacles: GloamwoodCircleObstacle[] = [
      { id: 'left', kind: 'rock', x: -0.9, z: 0, radius: 0.72 },
      { id: 'right', kind: 'rock', x: 0.9, z: 0, radius: 0.72 },
    ]
    const result = resolveGloamwoodPlayerCollision({ x: 0, z: 0.35 }, 0, 0, obstacles, 12)
    expect(result.contacts).toBeGreaterThan(1)
    expect(result.minimumClearance).toBeGreaterThanOrEqual(-0.0001)
  })

  it('treats the whole visible shrine base as solid world geometry', () => {
    const shrine: GloamwoodCircleObstacle = { id: 'shrine-base', kind: 'shrine', x: 8, z: -5, radius: 5.8 }
    const result = resolveGloamwoodPlayerCollision({ x: 4.2, z: -5 }, 0, 2, [shrine])
    expect(result.contacts).toBeGreaterThan(0)
    expect(result.minimumClearance).toBeGreaterThanOrEqual(-0.00001)
    expect(Math.hypot(result.x - shrine.x, result.z - shrine.z)).toBeGreaterThan(shrine.radius)
  })
})
