import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_VALLEY,
  GLOAMWOOD_VALLEY_RIVER,
  gloamwoodValleyConfine,
  gloamwoodValleyDominantSurface,
  gloamwoodValleyHalfWidth,
  gloamwoodValleyHeight,
  gloamwoodValleyRegionAt,
  gloamwoodValleyRiverCenter,
  gloamwoodValleyRoadCenter,
  gloamwoodValleyRoadHalfWidth,
  gloamwoodValleyRiverHalfWidth,
  gloamwoodValleyRiverNearEdge,
  gloamwoodValleySurfaceWeights,
  gloamwoodValleyWalkable,
  gloamwoodValleyWalkableHalfWidth,
  gloamwoodValleyWaterDepth,
  gloamwoodValleyWaterHeight,
} from '../src/gloamwood-valley-terrain'

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
    // No single step may jump more than half the whole narrowing.
    const narrowing = GLOAMWOOD_VALLEY.corridorHalfWidth - GLOAMWOOD_VALLEY.chokeHalfWidth
    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index] - samples[index - 1]).toBeLessThan(narrowing * 0.55)
    }
  })

  it('is a valley the player cannot see over, not a field', () => {
    // The silhouette does most of the work in a generated map.
    const x = 300
    const half = gloamwoodValleyHalfWidth(x)
    const road = gloamwoodValleyHeight(x, gloamwoodValleyRoadCenter(x))
    const wall = gloamwoodValleyHeight(x, half)
    expect(wall - road).toBeGreaterThan(4)
  })

  it('keeps the road graded flat while the banks roll', () => {
    const roadSamples = [200, 210, 220, 230].map((x) => gloamwoodValleyHeight(x, gloamwoodValleyRoadCenter(x)))
    const spread = Math.max(...roadSamples) - Math.min(...roadSamples)
    expect(spread).toBeLessThan(0.35)
  })

  it('climbs from the river mouth to the headwater', () => {
    expect(gloamwoodValleyHeight(1500, gloamwoodValleyRoadCenter(1500)))
      .toBeGreaterThan(gloamwoodValleyHeight(60, gloamwoodValleyRoadCenter(60)) + 3)
  })
})

describe('Surfaces', () => {
  it('reads road on the path, bank between, wall at the edge', () => {
    const x = 300
    const half = gloamwoodValleyHalfWidth(x)
    expect(gloamwoodValleyDominantSurface(x, gloamwoodValleyRoadCenter(x))).toBe('road')
    expect(gloamwoodValleyDominantSurface(x, half * 0.6)).toBe('bank')
    expect(gloamwoodValleyDominantSurface(x, half * 0.98)).toBe('wall')
  })

  it('always produces weights that sum to one, so nothing renders untextured', () => {
    for (let x = 0; x <= GLOAMWOOD_VALLEY.length; x += 97) {
      for (const t of [0, 0.3, 0.6, 0.9, 1.2]) {
        const weights = gloamwoodValleySurfaceWeights(x, gloamwoodValleyHalfWidth(x) * t)
        const total = weights.road + weights.bank + weights.wall
        expect(total, `x=${x} t=${t}`).toBeCloseTo(1, 5)
      }
    }
  })
})

describe('Regions and bounds', () => {
  it('places three regions with the chokes between them', () => {
    expect(gloamwoodValleyRegionAt(200)?.id).toBe('shallows')
    expect(gloamwoodValleyRegionAt(800)?.id).toBe('gorge')
    expect(gloamwoodValleyRegionAt(1400)?.id).toBe('headwater')
    // A choke sits in the gap, which is what makes it a boundary rather than a
    // landmark inside a region.
    for (const choke of GLOAMWOOD_VALLEY.chokes) expect(gloamwoodValleyRegionAt(choke)).toBeNull()
  })

  it('rises in danger tier along the valley', () => {
    const tiers = GLOAMWOOD_VALLEY.regions.map((region) => region.tier)
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b))
    expect(new Set(tiers).size).toBe(tiers.length)
  })

  it('confines a wanderer without ever placing them inside a wall', () => {
    for (let x = -50; x <= GLOAMWOOD_VALLEY.length + 50; x += 83) {
      for (const z of [-400, -80, 0, 80, 400]) {
        const point = gloamwoodValleyConfine(x, z)
        expect(gloamwoodValleyWalkable(point.x, point.z), `${x},${z}`).toBe(true)
      }
    }
  })

  it('lets the spawn stand where it is placed', () => {
    expect(gloamwoodValleyWalkable(GLOAMWOOD_VALLEY.spawn.x, GLOAMWOOD_VALLEY.spawn.z)).toBe(true)
  })
})

describe('The river', () => {
  it('undercuts the wall rather than climbing it', () => {
    // The far bank is allowed past the walkable limit - a river cutting the
    // base of a cliff is right, and the carve applies to the wall too, so it
    // notches it instead of leaving water lying on a slope. What it may not do
    // is run so far out that the channel is inside the wall face.
    for (let x = 0; x <= GLOAMWOOD_VALLEY.length; x += 5) {
      const far = gloamwoodValleyRiverCenter(x) - gloamwoodValleyRiverHalfWidth(x)
      expect(far).toBeGreaterThan(-gloamwoodValleyHalfWidth(x) * 0.75)
      expect(gloamwoodValleyWaterDepth(x, far)).toBeLessThan(0.35)
    }
  })

  it('cuts a channel instead of laying water on flat ground', () => {
    for (const x of [120, 540, 830, 1120, 1400]) {
      const center = gloamwoodValleyRiverCenter(x)
      const bank = gloamwoodValleyRiverHalfWidth(x) * 1.6
      expect(gloamwoodValleyHeight(x, center)).toBeLessThan(gloamwoodValleyHeight(x, center - bank) - 1)
      expect(gloamwoodValleyHeight(x, center)).toBeLessThan(gloamwoodValleyHeight(x, center + bank) - 1)
    }
  })

  it('always runs below the road it follows', () => {
    // Water higher than the path reads as a canal on a levee, not a valley
    // floor, and the rolling noise will happily lift the far bank above the
    // near one if nothing stops it.
    for (let x = 0; x <= GLOAMWOOD_VALLEY.length; x += 5) {
      expect(gloamwoodValleyWaterHeight(x)).toBeLessThan(gloamwoodValleyHeight(x, gloamwoodValleyRoadCenter(x)))
    }
  })

  it('keeps the water surface above its own bed', () => {
    for (let x = 0; x <= GLOAMWOOD_VALLEY.length; x += 5) {
      const center = gloamwoodValleyRiverCenter(x)
      expect(gloamwoodValleyWaterDepth(x, center)).toBeGreaterThan(0.6)
    }
  })

  it('stops the player at the water line, not knee deep in it', () => {
    // There is no wading animation, so anywhere the player may stand has to be
    // dry or barely wet.
    for (let x = 0; x <= GLOAMWOOD_VALLEY.length; x += 3) {
      const center = gloamwoodValleyRiverCenter(x)
      const wade = gloamwoodValleyRiverHalfWidth(x) * GLOAMWOOD_VALLEY_RIVER.wadeShare
      for (const side of [-1, 1]) {
        expect(gloamwoodValleyWaterDepth(x, center + side * wade)).toBeLessThan(0.2)
      }
    }
  })

  it('pushes a swimmer out to the road side, not through the wall', () => {
    // Same defect class as the arena that only ever held the boss in: a confine
    // that resolves one boundary by breaking another.
    for (let x = 20; x < GLOAMWOOD_VALLEY.length; x += 7) {
      const center = gloamwoodValleyRiverCenter(x)
      const pushed = gloamwoodValleyConfine(x, center)
      expect(gloamwoodValleyWalkable(pushed.x, pushed.z)).toBe(true)
    }
  })

  it('leaves a passable gap at both chokes', () => {
    for (const choke of GLOAMWOOD_VALLEY.chokes) {
      const near = gloamwoodValleyRiverCenter(choke) + gloamwoodValleyRiverHalfWidth(choke)
      const limit = gloamwoodValleyWalkableHalfWidth(choke)
      // Wide enough for the player and a region boss to be in it at once: the
      // Bladeshell's body radius is 1.8, so anything under about four body
      // widths turns the gate into a place where the fight cannot happen.
      expect(limit - near).toBeGreaterThan(7)
    }
  })
})

describe('The road', () => {
  it('wanders, so it does not read as a runway', () => {
    let widest = 0
    for (let x = 0; x <= GLOAMWOOD_VALLEY.length; x += 5) {
      widest = Math.max(widest, Math.abs(gloamwoodValleyRoadCenter(x)))
    }
    expect(widest).toBeGreaterThan(1.5)
  })

  it('never runs into the river', () => {
    // The two are laid out by separate functions with no shared clamp, which is
    // exactly the arrangement that has produced every boundary defect on this
    // project so far.
    for (let x = 0; x <= GLOAMWOOD_VALLEY.length; x += 2) {
      const roadEdge = gloamwoodValleyRoadCenter(x) - gloamwoodValleyRoadHalfWidth(x)
      const waterEdge = gloamwoodValleyRiverCenter(x) + gloamwoodValleyRiverHalfWidth(x)
      expect(roadEdge).toBeGreaterThan(waterEdge)
    }
  })

  it('stays inside the walkable floor at its narrowest', () => {
    for (const choke of GLOAMWOOD_VALLEY.chokes) {
      const limit = gloamwoodValleyWalkableHalfWidth(choke)
      expect(gloamwoodValleyRoadCenter(choke) + gloamwoodValleyRoadHalfWidth(choke)).toBeLessThan(limit)
    }
  })
})

describe('The river stays where the player can see it', () => {
  it('never drifts more than a screen off the road', () => {
    // The camera frames about eighteen units either side of the player. A
    // feature further out than that is on the map and not in the game.
    for (let x = 0; x <= GLOAMWOOD_VALLEY.length; x += 5) {
      const gap = gloamwoodValleyRoadCenter(x) - gloamwoodValleyRiverNearEdge(x)
      expect(gap).toBeGreaterThan(0)
      expect(gap).toBeLessThan(18)
    }
  })
})

describe('Room to fight', () => {
  const pocket = (x: number) => {
    // Widest unbroken stretch of standable floor at this point.
    const limit = gloamwoodValleyWalkableHalfWidth(x)
    let best = 0
    let start: number | null = null
    for (let z = -limit; z <= limit; z += 0.25) {
      const standable = gloamwoodValleyWalkable(x, z)
      if (standable && start === null) start = z
      if ((!standable || z + 0.25 > limit) && start !== null) {
        best = Math.max(best, z - start)
        start = null
      }
    }
    return best
  }

  it('gives every region boss an arena it can be fought in', () => {
    // The Gloamwood's boss arena is 15.2 across and the Bladeshell's ground
    // slam has a 4.3 radius. Anything tighter and the boss's whole moveset
    // covers the floor, which is not a fight.
    for (const x of GLOAMWOOD_VALLEY.bossSlots) {
      expect(pocket(x)).toBeGreaterThan(15.2)
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
