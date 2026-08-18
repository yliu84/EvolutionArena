import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_VALLEY_BRANCHES, GLOAMWOOD_VALLEY_FORDS } from '../src/gloamwood-valley-branches'
import {
  GLOAMWOOD_VALLEY,
  GLOAMWOOD_VALLEY_LENGTH,
  GLOAMWOOD_VALLEY_RIVER,
  gloamwoodValleyConfine,
  gloamwoodValleyChannelHalfWidth,
  gloamwoodValleyCorridorAt,
  gloamwoodValleyDominantSurface,
  gloamwoodValleyHalfWidth,
  gloamwoodValleyHeight,
  gloamwoodValleyPointAt,
  gloamwoodValleyProject,
  gloamwoodValleyRegionAt,
  gloamwoodValleyRiverHalfWidth,
  gloamwoodValleyRiverNearEdge,
  gloamwoodValleyRiverOffset,
  gloamwoodValleyRoadHalfWidth,
  gloamwoodValleyRoadOffset,
  gloamwoodValleySurfaceWeights,
  gloamwoodValleyWalkable,
  gloamwoodValleyWalkableHalfWidth,
  gloamwoodValleyWaterDepth,
  gloamwoodValleyWaterHalfWidth,
  gloamwoodValleyWaterHeight,
} from '../src/gloamwood-valley-terrain'

/** Height at a point given in route coordinates. */
function heightAt(s: number, lateral: number) {
  const point = gloamwoodValleyPointAt(s, lateral)
  return gloamwoodValleyHeight(point.x, point.z)
}

describe('The route', () => {
  it('turns, so the map is not one corridor to the end', () => {
    // Walk a stretch, arrive somewhere open, leave it facing somewhere else.
    // A straight route makes every measurement easy and the map a rail.
    const headings: number[] = []
    for (let index = 0; index < GLOAMWOOD_VALLEY.spine.length - 1; index += 1) {
      const [ax, az] = GLOAMWOOD_VALLEY.spine[index]
      const [bx, bz] = GLOAMWOOD_VALLEY.spine[index + 1]
      headings.push(Math.atan2(bz - az, bx - ax))
    }
    const turns = headings.slice(1).map((heading, index) => Math.abs(heading - headings[index]))
    expect(turns.filter((turn) => turn > 0.7)).toHaveLength(4)
    // and none of them doubles back, which would put the player walking into
    // ground they have already cleared.
    for (const turn of turns) expect(turn).toBeLessThan(Math.PI * 0.62)
  })

  it('opens out where it turns', () => {
    let travelled = 0
    for (let index = 0; index < GLOAMWOOD_VALLEY.spine.length - 2; index += 1) {
      const [ax, az] = GLOAMWOOD_VALLEY.spine[index]
      const [bx, bz] = GLOAMWOOD_VALLEY.spine[index + 1]
      travelled += Math.hypot(bx - ax, bz - az)
      expect(gloamwoodValleyHalfWidth(travelled)).toBeGreaterThan(GLOAMWOOD_VALLEY.corridorHalfWidth * 1.3)
    }
  })

  it('is about as long as the time budget asked for', () => {
    expect(GLOAMWOOD_VALLEY_LENGTH).toBeGreaterThan(1500)
    expect(GLOAMWOOD_VALLEY_LENGTH).toBeLessThan(1750)
  })

  it('measures distance along itself, not along the world axis', () => {
    // Two points far apart along the route can be neighbours in the world once
    // it folds, which is exactly why every function here takes s.
    const near = gloamwoodValleyPointAt(1200, 0)
    const hit = gloamwoodValleyProject(near.x, near.z)
    expect(hit.s).toBeCloseTo(1200, 0)
    expect(hit.distance).toBeLessThan(0.01)
  })

  it('reads the side of the route by sign, since there is no axis left', () => {
    for (const s of [80, 400, 900, 1400]) {
      const left = gloamwoodValleyPointAt(s, 12)
      expect(gloamwoodValleyProject(left.x, left.z).lateral).toBeCloseTo(12, 4)
      const right = gloamwoodValleyPointAt(s, -12)
      expect(gloamwoodValleyProject(right.x, right.z).lateral).toBeCloseTo(-12, 4)
    }
  })
})

describe('Valley shape', () => {
  it('narrows hard at the chokes and opens at the basins', () => {
    for (const choke of GLOAMWOOD_VALLEY.chokes) {
      expect(gloamwoodValleyHalfWidth(choke)).toBeCloseTo(GLOAMWOOD_VALLEY.chokeHalfWidth, 5)
    }
    for (const [from, to] of GLOAMWOOD_VALLEY.basins) {
      expect(gloamwoodValleyHalfWidth((from + to) / 2)).toBeCloseTo(GLOAMWOOD_VALLEY.basinHalfWidth, 1)
    }
  })

  it('eases in and out of a choke rather than stepping', () => {
    // A step reads as a door frame dropped into the terrain.
    const choke = GLOAMWOOD_VALLEY.chokes[0]
    const span = GLOAMWOOD_VALLEY.chokeSpan
    const samples = [0, 0.25, 0.5, 0.75, 1].map((share) => gloamwoodValleyHalfWidth(choke + span * share))
    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index]).toBeGreaterThan(samples[index - 1])
    }
    const narrowing = GLOAMWOOD_VALLEY.corridorHalfWidth - GLOAMWOOD_VALLEY.chokeHalfWidth
    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index] - samples[index - 1]).toBeLessThan(narrowing * 0.55)
    }
  })

  it('is a valley the player cannot see over, not a field', () => {
    // The silhouette does most of the work in a generated map, and the camera
    // sits 11.8 above the player. Sampled on straight stretches away from the
    // branch mouths: a lateral offset taken at a mouth runs down the branch, and
    // one taken at a corner projects back onto a different part of the route.
    for (const s of [120, 480, 640]) {
      const half = gloamwoodValleyHalfWidth(s)
      expect(heightAt(s, half) - heightAt(s, gloamwoodValleyRoadOffset(s))).toBeGreaterThan(11.8)
    }
  })

  it('keeps the path graded flat while the banks roll', () => {
    const samples = [200, 210, 220, 230].map((s) => heightAt(s, gloamwoodValleyRoadOffset(s)))
    expect(Math.max(...samples) - Math.min(...samples)).toBeLessThan(0.35)
  })

  it('climbs from the river mouth to the headwater', () => {
    expect(heightAt(1500, gloamwoodValleyRoadOffset(1500)))
      .toBeGreaterThan(heightAt(60, gloamwoodValleyRoadOffset(60)) + 3)
  })
})

describe('Surfaces', () => {
  it('reads road on the path, bank between, wall at the edge', () => {
    const s = 480
    const half = gloamwoodValleyHalfWidth(s)
    const at = (lateral: number) => {
      const point = gloamwoodValleyPointAt(s, lateral)
      return gloamwoodValleyDominantSurface(point.x, point.z)
    }
    expect(at(gloamwoodValleyRoadOffset(s))).toBe('road')
    expect(at(half * 0.45)).toBe('bank')
    expect(at(half * 0.98)).toBe('wall')
  })

  it('always produces weights that sum to one, so nothing renders untextured', () => {
    for (let s = 0; s <= GLOAMWOOD_VALLEY_LENGTH; s += 97) {
      for (const share of [0, 0.3, 0.6, 0.9, 1.2]) {
        const point = gloamwoodValleyPointAt(s, gloamwoodValleyHalfWidth(s) * share)
        const weights = gloamwoodValleySurfaceWeights(point.x, point.z)
        expect(weights.road + weights.bank + weights.wall).toBeCloseTo(1, 6)
      }
    }
  })
})

describe('The river', () => {
  it('cuts a channel instead of laying water on flat ground', () => {
    for (const s of [120, 640, 900, 1300]) {
      const centre = gloamwoodValleyRiverOffset(s)
      const bank = gloamwoodValleyChannelHalfWidth(s) * 1.25
      expect(heightAt(s, centre)).toBeLessThan(heightAt(s, centre - bank) - 1)
      expect(heightAt(s, centre)).toBeLessThan(heightAt(s, centre + bank) - 1)
    }
  })

  it('always runs below the road it follows', () => {
    // Water higher than the path reads as a canal on a levee, not a valley
    // floor, and the rolling noise will happily lift the far bank above the
    // near one if nothing stops it.
    for (let s = 0; s <= GLOAMWOOD_VALLEY_LENGTH; s += 5) {
      expect(gloamwoodValleyWaterHeight(s)).toBeLessThan(heightAt(s, gloamwoodValleyRoadOffset(s)))
    }
  })

  it('keeps the water surface above its own bed, away from the fords', () => {
    for (let s = 0; s <= GLOAMWOOD_VALLEY_LENGTH; s += 5) {
      if (GLOAMWOOD_VALLEY_FORDS.some((ford) => Math.abs(s - ford) < 40)) continue
      const point = gloamwoodValleyPointAt(s, gloamwoodValleyRiverOffset(s))
      expect(gloamwoodValleyWaterDepth(point.x, point.z)).toBeGreaterThan(0.6)
    }
  })

  it('undercuts the wall rather than climbing it', () => {
    // The far bank is allowed past the walkable limit - a river cutting the
    // base of a cliff is right, and the carve applies to the wall too, so it
    // notches it instead of leaving water lying on a slope.
    for (let s = 0; s <= GLOAMWOOD_VALLEY_LENGTH; s += 5) {
      const far = gloamwoodValleyRiverOffset(s) - gloamwoodValleyRiverHalfWidth(s)
      expect(far).toBeGreaterThan(-gloamwoodValleyHalfWidth(s) * 0.75)
    }
  })

  it('never drifts more than a screen off the road', () => {
    // The camera frames about eighteen units either side of the player. A
    // feature further out than that is on the map and not in the game.
    for (let s = 0; s <= GLOAMWOOD_VALLEY_LENGTH; s += 5) {
      const gap = gloamwoodValleyRoadOffset(s) - gloamwoodValleyRiverNearEdge(s)
      expect(gap).toBeGreaterThan(0)
      expect(gap).toBeLessThan(18)
    }
  })

  it('leaves a passable gap at both chokes', () => {
    for (const choke of GLOAMWOOD_VALLEY.chokes) {
      // Wide enough for the player and a region boss to be in it at once.
      expect(gloamwoodValleyWalkableHalfWidth(choke) - gloamwoodValleyRiverNearEdge(choke)).toBeGreaterThan(7)
    }
  })
})

describe('The road', () => {
  it('never runs into the river', () => {
    // The two are laid out by separate functions, which is exactly the
    // arrangement that has produced every boundary defect on this project.
    for (let s = 0; s <= GLOAMWOOD_VALLEY_LENGTH; s += 2) {
      expect(gloamwoodValleyRoadOffset(s) - gloamwoodValleyRoadHalfWidth(s))
        .toBeGreaterThan(gloamwoodValleyRiverOffset(s) + gloamwoodValleyChannelHalfWidth(s))
    }
  })

  it('stays inside the walkable floor at its narrowest', () => {
    for (const choke of GLOAMWOOD_VALLEY.chokes) {
      expect(gloamwoodValleyRoadOffset(choke) + gloamwoodValleyRoadHalfWidth(choke))
        .toBeLessThan(gloamwoodValleyWalkableHalfWidth(choke))
    }
  })
})

describe('Fords', () => {
  it('let the player cross where a branch waits on the far bank', () => {
    for (const ford of GLOAMWOOD_VALLEY_FORDS) {
      const point = gloamwoodValleyPointAt(ford, gloamwoodValleyRiverOffset(ford))
      expect(gloamwoodValleyWaterDepth(point.x, point.z)).toBeLessThan(0.25)
      expect(gloamwoodValleyWalkable(point.x, point.z)).toBe(true)
    }
  })

  it('has one for every branch on the far bank, and no crossing without one', () => {
    const farSide = GLOAMWOOD_VALLEY_BRANCHES.filter((branch) => branch.side === -1)
    expect(farSide.length).toBeGreaterThan(0)
    for (const branch of farSide) {
      expect(GLOAMWOOD_VALLEY_FORDS.some((ford) => Math.abs(ford - branch.mouthS) < 30)).toBe(true)
    }
  })

  it('does not turn the whole river into a paddling pool', () => {
    let shallow = 0
    let sampled = 0
    for (let s = 0; s <= GLOAMWOOD_VALLEY_LENGTH; s += 5) {
      const point = gloamwoodValleyPointAt(s, gloamwoodValleyRiverOffset(s))
      sampled += 1
      if (gloamwoodValleyWaterDepth(point.x, point.z) < 0.25) shallow += 1
    }
    expect(shallow / sampled).toBeLessThan(0.12)
  })
})

describe('Branches', () => {
  it('every branch meets the road it leaves', () => {
    // A branch whose mouth misses the road is a chamber the player can see and
    // never reach.
    for (const branch of GLOAMWOOD_VALLEY_BRANCHES) {
      const mouth = gloamwoodValleyPointAt(branch.mouthS, gloamwoodValleyRoadOffset(branch.mouthS))
      expect(gloamwoodValleyWalkable(mouth.x, mouth.z)).toBe(true)
      const corridor = gloamwoodValleyCorridorAt(mouth.x, mouth.z)
      expect(corridor.pathDistance).toBeLessThan(corridor.pathHalfWidth)
    }
  })

  it('opens a chamber big enough to fight in at the end of every one', () => {
    for (const [index, branch] of GLOAMWOOD_VALLEY_BRANCHES.entries()) {
      expect(branch.chamberHalfWidth * 2 * GLOAMWOOD_VALLEY.walkShare).toBeGreaterThan(15.2)
      expect(index).toBeLessThan(GLOAMWOOD_VALLEY_BRANCHES.length)
    }
  })

  it('gives the player somewhere to go in every region', () => {
    for (const region of GLOAMWOOD_VALLEY.regions) {
      const inside = GLOAMWOOD_VALLEY_BRANCHES.filter(
        (branch) => branch.mouthS >= region.from && branch.mouthS <= region.to,
      )
      expect(inside.length).toBeGreaterThan(0)
    }
  })

  it('offers a way round as well as a way through', () => {
    // A map of dead ends is still a corridor with alcoves.
    expect(GLOAMWOOD_VALLEY_BRANCHES.filter((branch) => branch.kind === 'loop').length).toBeGreaterThan(1)
    for (const branch of GLOAMWOOD_VALLEY_BRANCHES) {
      if (branch.kind !== 'loop') continue
      expect(branch.rejoinS).toBeDefined()
      const rejoin = gloamwoodValleyPointAt(branch.rejoinS!, gloamwoodValleyRoadOffset(branch.rejoinS!))
      expect(gloamwoodValleyWalkable(rejoin.x, rejoin.z)).toBe(true)
    }
  })

  it('carves its own floor through the valley wall instead of sitting on it', () => {
    for (const [index, branch] of GLOAMWOOD_VALLEY_BRANCHES.entries()) {
      const chamberS = (branch.mouthS + (branch.rejoinS ?? branch.mouthS)) / 2
      const chamber = gloamwoodValleyPointAt(chamberS, branch.side * branch.reach)
      // Standable, which it would not be if the wall simply ran over it.
      expect(gloamwoodValleyWalkable(chamber.x, chamber.z)).toBe(true)
      expect(gloamwoodValleyCorridorAt(chamber.x, chamber.z).branch?.id).toBe(branch.id)
      expect(index).toBeGreaterThanOrEqual(0)
    }
  })

  it('sits at the height its own climb asks for', () => {
    const shelf = GLOAMWOOD_VALLEY_BRANCHES.find((branch) => branch.id === 'scree-shelf')!
    const chamber = gloamwoodValleyPointAt(shelf.mouthS, shelf.side * shelf.reach)
    const road = gloamwoodValleyPointAt(shelf.mouthS, gloamwoodValleyRoadOffset(shelf.mouthS))
    const rise = gloamwoodValleyHeight(chamber.x, chamber.z) - gloamwoodValleyHeight(road.x, road.z)
    expect(rise).toBeGreaterThan(shelf.climb * 0.5)
  })
})

describe('Room to fight', () => {
  const pocket = (s: number) => {
    // Widest unbroken stretch of standable floor across the route here.
    const limit = gloamwoodValleyWalkableHalfWidth(s)
    let best = 0
    let start: number | null = null
    for (let lateral = -limit; lateral <= limit; lateral += 0.25) {
      const point = gloamwoodValleyPointAt(s, lateral)
      const standable = gloamwoodValleyWalkable(point.x, point.z)
      if (standable && start === null) start = lateral
      if ((!standable || lateral + 0.25 > limit) && start !== null) {
        best = Math.max(best, lateral - start)
        start = null
      }
    }
    return best
  }

  it('gives every region boss an arena it can be fought in', () => {
    // The Gloamwood's boss arena is 15.2 across and a region boss's ground slam
    // has a 4.3 radius. Anything tighter and its whole moveset covers the
    // floor, which is not a fight.
    for (const s of GLOAMWOOD_VALLEY.bossSlots) {
      expect(pocket(s)).toBeGreaterThan(15.2)
    }
  })

  it('keeps the chokes as gates, not as arenas', () => {
    for (const choke of GLOAMWOOD_VALLEY.chokes) {
      expect(pocket(choke)).toBeLessThan(15.2)
      // Still walkable, or the gate is a wall.
      expect(pocket(choke)).toBeGreaterThan(4)
    }
  })
})

describe('Staying on the map', () => {
  it('puts a pushed position back on standable ground', () => {
    // Same defect class as the arena that only ever held the boss in: a confine
    // that resolves one boundary by breaking another.
    for (let s = 20; s < GLOAMWOOD_VALLEY_LENGTH - 20; s += 23) {
      for (const lateral of [-90, -40, gloamwoodValleyRiverOffset(s), 0, 40, 90]) {
        const point = gloamwoodValleyPointAt(s, lateral)
        const confined = gloamwoodValleyConfine(point.x, point.z)
        expect(gloamwoodValleyWalkable(confined.x, confined.z)).toBe(true)
      }
    }
  })

  it('leaves a position that was already fine where it was', () => {
    for (let s = 40; s < GLOAMWOOD_VALLEY_LENGTH - 40; s += 37) {
      const point = gloamwoodValleyPointAt(s, gloamwoodValleyRoadOffset(s))
      const confined = gloamwoodValleyConfine(point.x, point.z)
      expect(Math.hypot(confined.x - point.x, confined.z - point.z)).toBeLessThan(0.01)
    }
  })
})

describe('Regions', () => {
  it('covers the route with three regions and two gaps at the gates', () => {
    expect(gloamwoodValleyRegionAt(100)?.id).toBe('shallows')
    expect(gloamwoodValleyRegionAt(700)?.id).toBe('gorge')
    expect(gloamwoodValleyRegionAt(1400)?.id).toBe('headwater')
    for (const choke of GLOAMWOOD_VALLEY.chokes) expect(gloamwoodValleyRegionAt(choke)).toBeNull()
  })

  it('never lets the water be deep enough to swim in where the player may stand', () => {
    for (let s = 0; s < GLOAMWOOD_VALLEY_LENGTH; s += 11) {
      const limit = gloamwoodValleyWalkableHalfWidth(s)
      for (let lateral = -limit; lateral <= limit; lateral += 1) {
        const point = gloamwoodValleyPointAt(s, lateral)
        if (!gloamwoodValleyWalkable(point.x, point.z)) continue
        expect(gloamwoodValleyWaterDepth(point.x, point.z)).toBeLessThan(0.25)
      }
    }
  })

  it('knows the deepest part of the river is not standable', () => {
    expect(GLOAMWOOD_VALLEY_RIVER.depth).toBeGreaterThan(0.25)
  })
})

describe('One route, measured one way', () => {
  it('offsets and projections agree, so the river is drawn where it is cut', () => {
    // The terrain measures with nearest-point projection; every ribbon mesh is
    // built by offsetting along the normal. On a hard corner those two answers
    // diverge, and the river was cut in one place and drawn in another - which
    // is what sliced it into pieces. Rounding the corners is what makes this
    // hold, so the test guards the rounding rather than the symptom.
    for (let s = 30; s < GLOAMWOOD_VALLEY_LENGTH - 30; s += 7) {
      for (const lateral of [-16, -8, 0, 8, 16]) {
        const point = gloamwoodValleyPointAt(s, lateral)
        const hit = gloamwoodValleyProject(point.x, point.z)
        expect(Math.abs(hit.lateral - lateral)).toBeLessThan(0.7)
        expect(Math.abs(hit.s - s)).toBeLessThan(3)
      }
    }
  })

  it('keeps the water inside its own channel the whole way down', () => {
    for (let s = 0; s <= GLOAMWOOD_VALLEY_LENGTH; s += 3) {
      const half = gloamwoodValleyWaterHalfWidth(s)
      for (const share of [-1.02, -0.6, 0, 0.6, 1.02]) {
        const point = gloamwoodValleyPointAt(s, gloamwoodValleyRiverOffset(s) + half * share)
        // Where the mesh puts water, the ground must be below the surface.
        expect(gloamwoodValleyHeight(point.x, point.z)).toBeLessThan(gloamwoodValleyWaterHeight(s) + 0.02)
      }
    }
  })
})

describe('Crossing the river', () => {
  it('puts a swimmer out on the bank they walked in from', () => {
    // An earlier confine searched the road side first whatever the position, so
    // stepping into the water from the far bank came out on the near one: a
    // one-frame teleport across the river, and a way to skip a ford entirely.
    for (let s = 30; s < GLOAMWOOD_VALLEY_LENGTH - 30; s += 13) {
      if (GLOAMWOOD_VALLEY_FORDS.some((ford) => Math.abs(s - ford) < 45)) continue
      const centre = gloamwoodValleyRiverOffset(s)
      const half = gloamwoodValleyRiverHalfWidth(s)
      for (const side of [1, -1]) {
        const entry = gloamwoodValleyPointAt(s, centre + side * half * 0.4)
        const out = gloamwoodValleyConfine(entry.x, entry.z)
        const landed = gloamwoodValleyProject(out.x, out.z)
        expect(Math.sign(landed.lateral - gloamwoodValleyRiverOffset(landed.s))).toBe(side)
      }
    }
  })

  it('only lets the player reach the far bank at a ford', () => {
    // Walking the road from end to end must never leave the far side reachable
    // except where a crossing was authored.
    for (let s = 20; s < GLOAMWOOD_VALLEY_LENGTH - 20; s += 7) {
      const centre = gloamwoodValleyRiverOffset(s)
      const point = gloamwoodValleyPointAt(s, centre)
      const crossable = gloamwoodValleyWalkable(point.x, point.z)
      const atFord = GLOAMWOOD_VALLEY_FORDS.some((ford) => Math.abs(s - ford) < 24)
      if (crossable) expect(atFord).toBe(true)
    }
  })
})
