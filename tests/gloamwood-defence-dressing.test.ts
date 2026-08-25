import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_DEFENCE_SCATTER,
  scatterGloamwoodDefence,
} from '../src/gloamwood-defence-dressing'
import {
  GLOAMWOOD_DEFENCE,
  gloamwoodDefenceCameraLaneDistance,
  gloamwoodDefenceNearestWalkable,
  gloamwoodDefenceWalkable,
} from '../src/gloamwood-defence-terrain'

/**
 * The brief for this map was, in the owner's words, that trees and rocks must
 * not get in the way of sightlines or control. That is a rule about space, and
 * a rule about space is worth asserting rather than eyeballing on a screenshot.
 */

describe('the fighting ground stays clear', () => {
  const props = scatterGloamwoodDefence(0x5a11e)

  it('puts nothing on ground anyone can walk on', () => {
    for (const prop of props) {
      expect(
        gloamwoodDefenceWalkable(prop.x, prop.z),
        `${prop.kind} at ${prop.x.toFixed(2)},${prop.z.toFixed(2)} stands on the floor`,
      ).toBe(false)
    }
  })

  it('keeps trunks and boulders a clear step back from the edge', () => {
    // A trunk centred on the rim hangs its canopy over ground the player fights
    // on, which is the visual noise the brief asked to remove.
    for (const prop of props) {
      if (prop.kind === 'plant') continue
      const gap = gloamwoodDefenceNearestWalkable(prop.x, prop.z).distance
      expect(gap, `${prop.kind} only ${gap.toFixed(2)} from the floor`)
        .toBeGreaterThanOrEqual(GLOAMWOOD_DEFENCE_SCATTER.treeClearance)
    }
  })

  it('leaves the bowl and the altar completely empty', () => {
    const { arena, altar } = GLOAMWOOD_DEFENCE
    for (const prop of props) {
      expect(Math.hypot(prop.x - arena.x, prop.z - arena.z)).toBeGreaterThan(arena.radius)
      expect(Math.hypot(prop.x - altar.x, prop.z - altar.z)).toBeGreaterThan(altar.radius)
    }
  })

  it('does not drift into the road, which is the only approach', () => {
    for (let z = GLOAMWOOD_DEFENCE.portal.z; z <= GLOAMWOOD_DEFENCE.road.endZ; z += 0.5) {
      for (const prop of props) {
        if (Math.abs(prop.z - z) > 0.5) continue
        expect(gloamwoodDefenceWalkable(prop.x, prop.z)).toBe(false)
      }
    }
  })
})

describe('the scatter is a map, not a random pile', () => {
  it('rebuilds identically from the same seed', () => {
    // A recorded session has to be replayable against the map it happened on.
    expect(scatterGloamwoodDefence(7)).toEqual(scatterGloamwoodDefence(7))
  })

  it('gives a different map for a different seed', () => {
    expect(scatterGloamwoodDefence(7)).not.toEqual(scatterGloamwoodDefence(8))
  })

  it('meets its budget, so a shape change that starves it is visible', () => {
    const props = scatterGloamwoodDefence(0x5a11e)
    const counted = (kind: string) => props.filter((prop) => prop.kind === kind).length
    // Falling short means the walkable region grew and there is no longer room
    // for the wall band - which is a layout problem, not a scatter problem.
    expect(counted('tree')).toBe(GLOAMWOOD_DEFENCE_SCATTER.trees)
    expect(counted('rock')).toBe(GLOAMWOOD_DEFENCE_SCATTER.rocks)
    expect(counted('plant')).toBe(GLOAMWOOD_DEFENCE_SCATTER.plants)
  })

  it('hugs the walkable edge instead of filling the whole map', () => {
    // Everything past the band is out of frame at the gameplay camera, so
    // drawing it is pure cost.
    for (const prop of scatterGloamwoodDefence(0x5a11e)) {
      expect(gloamwoodDefenceNearestWalkable(prop.x, prop.z).distance)
        .toBeLessThanOrEqual(GLOAMWOOD_DEFENCE_SCATTER.wallBandDepth)
    }
  })

  it('rings the whole boundary rather than clumping on one side', () => {
    // Rejection sampling over a rectangle can starve a narrow part of the band
    // - here, the two long sides of the road - and the failure looks like a
    // corridor with trees on one side only.
    const props = scatterGloamwoodDefence(0x5a11e)
    const quadrant = (predicate: (prop: { x: number; z: number }) => boolean) =>
      props.filter(predicate).length
    const roadLeft = quadrant((prop) => prop.x < 0 && prop.z < GLOAMWOOD_DEFENCE.road.endZ)
    const roadRight = quadrant((prop) => prop.x > 0 && prop.z < GLOAMWOOD_DEFENCE.road.endZ)
    const bowlLeft = quadrant((prop) => prop.x < 0 && prop.z >= GLOAMWOOD_DEFENCE.road.endZ)
    const bowlRight = quadrant((prop) => prop.x > 0 && prop.z >= GLOAMWOOD_DEFENCE.road.endZ)
    for (const [name, count] of [['road left', roadLeft], ['road right', roadRight], ['bowl left', bowlLeft], ['bowl right', bowlRight]] as const) {
      expect(count, `${name} is bare`).toBeGreaterThan(20)
    }
  })
})

describe('the camera can see the fight', () => {
  it('keeps trunks and boulders out of the lane the lens flies through', () => {
    // The altar is against the south wall, so a camera behind the player is
    // inside that wall. The first build of this map framed a screenful of
    // canopy, and nothing in the layout said it would - the offset and the
    // scatter simply did not know about each other.
    for (const prop of scatterGloamwoodDefence(0x5a11e)) {
      if (prop.kind === 'plant') continue
      const lane = gloamwoodDefenceCameraLaneDistance(prop.x, prop.z)
      expect(lane, `${prop.kind} ${lane.toFixed(2)} from the camera lane`)
        .toBeGreaterThanOrEqual(GLOAMWOOD_DEFENCE_SCATTER.cameraClearance)
    }
  })

  it('measures that lane from the offset the map actually uses', () => {
    // Both readers take the offset from the layout constants. If the map
    // contract ever wrote its own, the scatter would clear the wrong ground.
    const { cameraOffset } = GLOAMWOOD_DEFENCE
    expect(Math.hypot(cameraOffset.x, cameraOffset.y, cameraOffset.z)).toBeCloseTo(20.08, 1)
    // Standing at the spawn, the lens is behind the altar and off the floor.
    const lens = {
      x: GLOAMWOOD_DEFENCE.spawn.x + cameraOffset.x,
      z: GLOAMWOOD_DEFENCE.spawn.z + cameraOffset.z,
    }
    expect(gloamwoodDefenceWalkable(lens.x, lens.z)).toBe(false)
    expect(gloamwoodDefenceCameraLaneDistance(lens.x, lens.z)).toBe(0)
  })
})
