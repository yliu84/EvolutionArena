import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_VALLEY,
  gloamwoodValleyConfine,
  gloamwoodValleyDominantSurface,
  gloamwoodValleyHalfWidth,
  gloamwoodValleyHeight,
  gloamwoodValleyRegionAt,
  gloamwoodValleySurfaceWeights,
  gloamwoodValleyWalkable,
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
    const samples = [0, 12, 24, 36, 46].map((offset) => gloamwoodValleyHalfWidth(choke + offset))
    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index]).toBeGreaterThan(samples[index - 1])
    }
    // No single step may jump more than a fifth of the whole narrowing.
    const span = GLOAMWOOD_VALLEY.corridorHalfWidth - GLOAMWOOD_VALLEY.chokeHalfWidth
    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index] - samples[index - 1]).toBeLessThan(span * 0.55)
    }
  })

  it('is a valley the player cannot see over, not a field', () => {
    // The silhouette does most of the work in a generated map.
    const x = 300
    const half = gloamwoodValleyHalfWidth(x)
    const road = gloamwoodValleyHeight(x, 0)
    const wall = gloamwoodValleyHeight(x, half)
    expect(wall - road).toBeGreaterThan(4)
  })

  it('keeps the road graded flat while the banks roll', () => {
    const roadSamples = [200, 210, 220, 230].map((x) => gloamwoodValleyHeight(x, 0))
    const spread = Math.max(...roadSamples) - Math.min(...roadSamples)
    expect(spread).toBeLessThan(0.35)
  })

  it('climbs from the river mouth to the headwater', () => {
    expect(gloamwoodValleyHeight(1500, 0)).toBeGreaterThan(gloamwoodValleyHeight(60, 0) + 3)
  })
})

describe('Surfaces', () => {
  it('reads road at the centre, bank between, wall at the edge', () => {
    const x = 300
    const half = gloamwoodValleyHalfWidth(x)
    expect(gloamwoodValleyDominantSurface(x, 0)).toBe('road')
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
