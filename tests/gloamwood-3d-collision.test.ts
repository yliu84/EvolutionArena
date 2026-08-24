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

describe('Shell stage-1 footprint', () => {
  it('gives the Shell form its own footprint instead of the Fang stage profile', () => {
    const fang = getGloamwoodPlayerCollisionProfile(1, 'fang')
    const shell = getGloamwoodPlayerCollisionProfile(1, 'shell')
    // 1.80 x 5.82 against the Fang form's 1.56 x 3.99 needs a wider, longer body.
    expect(shell.radius).toBeGreaterThan(fang.radius)
    expect(shell.frontOffset).toBeGreaterThan(fang.frontOffset)
    expect(shell.rearOffset).toBeGreaterThan(fang.rearOffset)
    // Other families and stages keep the accepted stage profile untouched.
    expect(getGloamwoodPlayerCollisionProfile(1)).toEqual(fang)
    expect(getGloamwoodPlayerCollisionProfile(0, 'shell')).toEqual(getGloamwoodPlayerCollisionProfile(0))
  })

  it('gives the Shell stage-2 body a footprint of its own rather than the Fang stage-2 one', () => {
    // 2.70 x 5.05 against the Fang stage-2 body's 2.03 x 4.91. Until this form
    // existed, a stage-2 Shell fell back to the Fang stage profile, which is the
    // third of the three stage-keyed branches recorded in the stage-2 contract.
    const stageDefault = getGloamwoodPlayerCollisionProfile(2)
    const shell = getGloamwoodPlayerCollisionProfile(2, 'shell')
    expect(shell).not.toEqual(stageDefault)
    expect(shell.radius).toBeGreaterThan(stageDefault.radius)
    // It also has to be bigger than its own stage-1 profile, or the second
    // evolution would put a much larger body inside a smaller footprint.
    const shellStageOne = getGloamwoodPlayerCollisionProfile(1, 'shell')
    expect(shell.radius).toBeGreaterThan(shellStageOne.radius)
    expect(shell.frontOffset).toBeGreaterThan(shellStageOne.frontOffset)
    expect(shell.rearOffset).toBeGreaterThan(shellStageOne.rearOffset)
  })

  it('gives the Swarm stage-2 body a footprint sized to its torso, not its stance', () => {
    // This body is 2.06 across the bounding box and 1.21 across the torso: it
    // stands on four spread spider legs. Sizing the radius from the stance would
    // give the nimblest form in the game a footprint wider than the Fang
    // stage-2 body, which is the opposite of what the route is.
    const stageDefault = getGloamwoodPlayerCollisionProfile(2)
    const swarm = getGloamwoodPlayerCollisionProfile(2, 'swarm')
    const shell = getGloamwoodPlayerCollisionProfile(2, 'shell')
    expect(swarm).not.toEqual(stageDefault)
    // Narrowest of the three stage-2 forms, and narrower than the stage default.
    expect(swarm.radius).toBeLessThan(stageDefault.radius)
    expect(swarm.radius).toBeLessThan(shell.radius)
    // But still bigger than its own stage-1 profile, or the second evolution
    // would put a larger body inside a smaller footprint.
    expect(swarm.radius).toBeGreaterThan(getGloamwoodPlayerCollisionProfile(1, 'swarm').radius)
  })

  it('keeps the wider Shell body clear of an obstacle the Fang body would pass', () => {
    const obstacles = [{ id: 'rock-1', kind: 'rock' as const, x: 1.4, z: 0, radius: 0.5 }]
    const fang = inspectGloamwoodPlayerCollision({ x: 0, z: 0 }, 0, 1, obstacles, 'fang')
    const shell = inspectGloamwoodPlayerCollision({ x: 0, z: 0 }, 0, 1, obstacles, 'shell')
    expect(shell.minimumClearance).toBeLessThan(fang.minimumClearance)
  })
})
