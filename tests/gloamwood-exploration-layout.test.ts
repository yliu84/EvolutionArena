import { describe, expect, it } from 'vitest'
import {
  GLOAMWOOD_EXPLORATION_LAYOUT,
  estimatedRunMinutes,
  explorationSeedFromSearch,
  hashExplorationSeed,
  isGloamwoodExplorationLabRequested,
  pointInsideNest,
  routeLength,
  spawnPointForSeed,
  totalRouteLength,
} from '../src/gloamwood-exploration-layout'

describe('Gloamwood V4 exploration layout', () => {
  it('uses a separate maplab=4 route and deterministic spawn seed', () => {
    expect(isGloamwoodExplorationLabRequested('?maplab=4&debug=1')).toBe(true)
    expect(isGloamwoodExplorationLabRequested('?maplab=3')).toBe(false)
    expect(explorationSeedFromSearch('?maplab=4&spawnSeed=hunt-42')).toBe('hunt-42')
    expect(spawnPointForSeed('hunt-42')).toEqual(spawnPointForSeed('hunt-42'))
    expect(hashExplorationSeed('hunt-42')).toBeGreaterThan(0)
    expect(new Set(['a', 'b', 'c', 'd'].map((seed) => spawnPointForSeed(seed).id)).size).toBe(4)
  })

  it('expands to a multi-region world with four safe spawns', () => {
    expect(GLOAMWOOD_EXPLORATION_LAYOUT.world).toEqual({ width: 7200, height: 4400 })
    expect(GLOAMWOOD_EXPLORATION_LAYOUT.spawnPoints).toHaveLength(4)
    const ids = GLOAMWOOD_EXPLORATION_LAYOUT.spawnPoints.map((spawn) => spawn.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('defines eight varied nests and one separate boss lair', () => {
    expect(GLOAMWOOD_EXPLORATION_LAYOUT.version).toBe(4)
    expect(GLOAMWOOD_EXPLORATION_LAYOUT.nests).toHaveLength(8)
    expect(GLOAMWOOD_EXPLORATION_LAYOUT.nests.filter((nest) => nest.elite)).toHaveLength(2)
    expect(new Set(GLOAMWOOD_EXPLORATION_LAYOUT.nests.map((nest) => nest.family)).size).toBe(6)
    expect(GLOAMWOOD_EXPLORATION_LAYOUT.nests.every((nest) => nest.waves >= 2 && nest.waves <= 3)).toBe(true)
    expect(GLOAMWOOD_EXPLORATION_LAYOUT.bossLair.id).toBe('ancient-heart')
  })

  it('keeps every random spawn outside nest danger radii', () => {
    for (const spawn of GLOAMWOOD_EXPLORATION_LAYOUT.spawnPoints) {
      for (const nest of GLOAMWOOD_EXPLORATION_LAYOUT.nests) {
        expect(Math.hypot(spawn.x - nest.x, spawn.y - nest.y)).toBeGreaterThan(spawn.safeRadius + nest.radius)
        expect(pointInsideNest(spawn.x, spawn.y, nest)).toBe(false)
      }
    }
  })

  it('provides broad routes and a measured 12 to 15 minute pacing window', () => {
    expect(Math.min(...GLOAMWOOD_EXPLORATION_LAYOUT.routes.map((route) => route.width))).toBeGreaterThanOrEqual(300)
    expect(GLOAMWOOD_EXPLORATION_LAYOUT.routes.every((route) => routeLength(route) > 1000)).toBe(true)
    expect(totalRouteLength()).toBeGreaterThan(20_000)
    expect(estimatedRunMinutes(5)).toBeCloseTo(12.7, 1)
    expect(estimatedRunMinutes(7)).toBeCloseTo(14.3, 1)
  })
})
