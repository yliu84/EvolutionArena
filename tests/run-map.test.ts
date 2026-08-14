import { describe, expect, it } from 'vitest'
import { createRunMap } from '../src/run-map'
import { getBiomeAt, WORLD_HEIGHT, WORLD_WIDTH } from '../src/world'

describe('seeded run maps', () => {
  it('recreates the same layout from the same seed', () => {
    expect(createRunMap('repeatable')).toEqual(createRunMap('repeatable'))
  })

  it('offers three route variants across a sample of seeds', () => {
    const layouts = new Set(Array.from({ length: 50 }, (_, index) => createRunMap(`run-${index}`).layoutId))
    expect(layouts.size).toBe(3)
  })

  it('keeps encounters, rewards, events and landmarks inside their declared zones', () => {
    for (const seed of ['north', 'central', 'south', 'challenge']) {
      const map = createRunMap(seed)
      for (const item of [...map.encounters, ...map.rewardSites, ...map.worldEvents, ...map.landmarks]) {
        expect(item.x).toBeGreaterThan(0)
        expect(item.x).toBeLessThan(WORLD_WIDTH)
        expect(item.y).toBeGreaterThan(0)
        expect(item.y).toBeLessThan(WORLD_HEIGHT)
        expect(getBiomeAt(item.x, item.y).id).toBe(item.biome)
      }
    }
  })

  it('preserves a guarded cache and a boss destination in every run', () => {
    const map = createRunMap('objectives')
    expect(map.rewardSites).toHaveLength(3)
    for (const site of map.rewardSites) {
      expect(map.encounters.some((encounter) => encounter.id === site.guardEncounterId)).toBe(true)
    }
    expect(map.landmarks.some((landmark) => landmark.kind === 'boss-lair')).toBe(true)
    expect(map.route.at(-1)).toEqual({ x: map.bossPosition.x + 160, y: map.bossPosition.y })
  })
})
