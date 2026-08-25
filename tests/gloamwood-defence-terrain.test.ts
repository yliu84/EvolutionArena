import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_DEFENCE,
  gloamwoodDefenceConfine,
  gloamwoodDefenceHeight,
  gloamwoodDefenceInterceptionDepth,
  gloamwoodDefenceMarchDistance,
  gloamwoodDefenceNearestWalkable,
  gloamwoodDefenceRoadHalfWidth,
  gloamwoodDefenceWalkable,
} from '../src/gloamwood-defence-terrain'
import { GLOAMWOOD_PREY } from '../src/gloamwood-3d-ecology'

/**
 * The layout is a set of promises about distance, and every one of them is a
 * number somebody will later tune a wave against. They are asserted here so a
 * change to the ground cannot silently change the pacing.
 */

const PLAYER_SPEED = 6.2

describe('the bowl is one connected piece of ground with one way in', () => {
  it('lets the player walk from the portal to the altar without leaving the floor', () => {
    // Sampled along the spine rather than reasoned about: the road and the bowl
    // are two separate regions and the seam between them is where a gap would
    // be, not at either end.
    for (let z = GLOAMWOOD_DEFENCE.portal.z; z <= GLOAMWOOD_DEFENCE.altar.z; z += 0.25) {
      expect(gloamwoodDefenceWalkable(0, z), `spine broke at z=${z.toFixed(2)}`).toBe(true)
    }
  })

  it('overlaps the road mouth with the bowl instead of touching it at a point', () => {
    // The first draft ended the road on the rim at z = 3, where the bowl is
    // zero units wide, so the two regions met at exactly one point.
    const seamZ = GLOAMWOOD_DEFENCE.road.endZ
    const bowlHalfWidth = Math.sqrt(
      GLOAMWOOD_DEFENCE.arena.radius ** 2 - (GLOAMWOOD_DEFENCE.arena.z - seamZ) ** 2,
    )
    expect(gloamwoodDefenceRoadHalfWidth(seamZ)).toBeLessThan(bowlHalfWidth)
  })

  it('flares the mouth so a wave arrives across an arc, not in single file', () => {
    expect(gloamwoodDefenceRoadHalfWidth(-20)).toBeCloseTo(GLOAMWOOD_DEFENCE.road.halfWidth, 5)
    expect(gloamwoodDefenceRoadHalfWidth(GLOAMWOOD_DEFENCE.road.endZ))
      .toBeCloseTo(GLOAMWOOD_DEFENCE.road.mouthHalfWidth, 5)
    expect(gloamwoodDefenceRoadHalfWidth(0)).toBeGreaterThan(GLOAMWOOD_DEFENCE.road.halfWidth)
  })

  it('walls off everything else, so the road is the only approach', () => {
    // Abreast of the bowl, well outside it, and abreast of the road but wide of
    // it. Both must be wall or the altar can be reached without crossing the
    // player's frontage.
    expect(gloamwoodDefenceWalkable(20, 16)).toBe(false)
    expect(gloamwoodDefenceWalkable(12, -18)).toBe(false)
    expect(gloamwoodDefenceWalkable(0, -32)).toBe(false)
  })
})

describe('the altar sits on the far side of the frontage the player has to hold', () => {
  it('is inside the bowl and backed against its south rim', () => {
    const { altar, arena } = GLOAMWOOD_DEFENCE
    expect(gloamwoodDefenceWalkable(altar.x, altar.z)).toBe(true)
    const southRim = arena.z + arena.radius
    // Its far edge reaches the rim, so nothing fits behind it.
    expect(altar.z + altar.radius).toBeCloseTo(southRim, 5)
  })

  it('puts the player between the mouth and the altar at spawn', () => {
    const { spawn, altar, road } = GLOAMWOOD_DEFENCE
    expect(spawn.z).toBeGreaterThan(road.endZ)
    expect(spawn.z).toBeLessThan(altar.z)
    expect(gloamwoodDefenceWalkable(spawn.x, spawn.z)).toBe(true)
  })

  it('leaves a frontage a leaker can be caught across, but only just', () => {
    const depth = gloamwoodDefenceInterceptionDepth()
    expect(depth).toBe(20)
    const playerSeconds = depth / PLAYER_SPEED
    const fangSeconds = depth / GLOAMWOOD_PREY.fang.moveSpeed
    // The player must be faster across it than the fastest attacker, or a leak
    // is unrecoverable and holding the line stops being a decision.
    expect(playerSeconds).toBeLessThan(fangSeconds)
    // ...but not so much faster that standing anywhere is safe.
    expect(fangSeconds / playerSeconds).toBeLessThan(2)
  })
})

describe('the march is long enough to string a wave out', () => {
  it('separates the families by several seconds over its length', () => {
    const march = gloamwoodDefenceMarchDistance()
    expect(march).toBe(54)
    const seconds = (speed: number) => march / speed
    // Fang first, Swarm behind it, Carapace last: the ordering is the texture,
    // and it costs nothing to author because it falls out of the walk speeds.
    expect(seconds(GLOAMWOOD_PREY.fang.moveSpeed))
      .toBeLessThan(seconds(GLOAMWOOD_PREY.swarm.moveSpeed))
    expect(seconds(GLOAMWOOD_PREY.swarm.moveSpeed))
      .toBeLessThan(seconds(GLOAMWOOD_PREY.shell.moveSpeed))
    expect(seconds(GLOAMWOOD_PREY.swarm.moveSpeed) - seconds(GLOAMWOOD_PREY.fang.moveSpeed))
      .toBeGreaterThan(3)
  })

  it('is long enough that the player can meet a wave on the road and get back', () => {
    // Running up the road has to be a real option or the mode is one static
    // stand. Out and back must fit inside the slowest arrival.
    const march = gloamwoodDefenceMarchDistance()
    const outAndBack = (2 * march) / PLAYER_SPEED
    expect(outAndBack).toBeLessThan(march / GLOAMWOOD_PREY.shell.moveSpeed)
  })
})

describe('the ground itself', () => {
  it('descends from the portal to the bowl', () => {
    const atPortal = gloamwoodDefenceHeight(0, GLOAMWOOD_DEFENCE.portal.z)
    const midRoad = gloamwoodDefenceHeight(0, -12)
    const atMouth = gloamwoodDefenceHeight(0, GLOAMWOOD_DEFENCE.road.endZ)
    expect(atPortal).toBeGreaterThan(midRoad)
    expect(midRoad).toBeGreaterThan(atMouth)
  })

  it('dishes the bowl shallowly, so the altar reads from across it', () => {
    const centre = gloamwoodDefenceHeight(GLOAMWOOD_DEFENCE.arena.x, GLOAMWOOD_DEFENCE.arena.z)
    const rim = gloamwoodDefenceHeight(GLOAMWOOD_DEFENCE.arena.x, GLOAMWOOD_DEFENCE.arena.z - GLOAMWOOD_DEFENCE.arena.radius)
    expect(centre).toBeLessThan(rim)
    expect(rim - centre).toBeCloseTo(GLOAMWOOD_DEFENCE.arenaDish, 2)
  })

  it('banks up outside the walkable ground', () => {
    const onFloor = gloamwoodDefenceHeight(0, 16)
    const justOff = gloamwoodDefenceHeight(GLOAMWOOD_DEFENCE.arena.radius + 1, 16)
    const wellOff = gloamwoodDefenceHeight(GLOAMWOOD_DEFENCE.arena.radius + 8, 16)
    expect(justOff).toBeGreaterThan(onFloor)
    expect(wellOff).toBeGreaterThan(justOff)
    expect(wellOff - onFloor).toBeGreaterThan(GLOAMWOOD_DEFENCE.wallHeight * 0.9)
  })

  it('has no step at the boundary, which would ring the fight with a crease', () => {
    // Sampled across the bowl's rim: the smoothstep exists so the bank leaves
    // the floor at zero gradient rather than as a visible ridge.
    const radius = GLOAMWOOD_DEFENCE.arena.radius
    let previous = gloamwoodDefenceHeight(radius - 0.4, 16)
    for (let offset = -0.3; offset <= 1.2; offset += 0.1) {
      const here = gloamwoodDefenceHeight(radius + offset, 16)
      expect(here - previous, `step at offset ${offset.toFixed(1)}`).toBeLessThan(0.25)
      previous = here
    }
  })
})

describe('confine puts anything off the floor back onto it', () => {
  it('returns walkable ground from anywhere in bounds', () => {
    const { halfWidth, halfDepth } = GLOAMWOOD_DEFENCE.bounds
    for (let x = -halfWidth; x <= halfWidth; x += 3.25) {
      for (let z = -halfDepth; z <= halfDepth; z += 3.4) {
        const confined = gloamwoodDefenceConfine(x, z)
        expect(gloamwoodDefenceWalkable(confined.x, confined.z), `from ${x},${z}`).toBe(true)
      }
    }
  })

  it('leaves a position that is already legal exactly where it was', () => {
    const confined = gloamwoodDefenceConfine(4, 18)
    expect(confined.x).toBeCloseTo(4, 6)
    expect(confined.z).toBeCloseTo(18, 6)
    expect(gloamwoodDefenceNearestWalkable(4, 18).distance).toBe(0)
  })

  it('pulls a point far outside the bounds back inside them', () => {
    const confined = gloamwoodDefenceConfine(500, -900)
    expect(Math.abs(confined.x)).toBeLessThanOrEqual(GLOAMWOOD_DEFENCE.bounds.halfWidth)
    expect(Math.abs(confined.z)).toBeLessThanOrEqual(GLOAMWOOD_DEFENCE.bounds.halfDepth)
    expect(gloamwoodDefenceWalkable(confined.x, confined.z)).toBe(true)
  })
})
