import { describe, expect, it } from 'vitest'
import { createSeededRandom, hashSeed } from '../src/evolution'
import { BIOMES } from '../src/world'
import { WORLD_PROP_TEXTURES, planBiomeProps } from '../src/world-art'

describe('playtest world art', () => {
  it('keeps props inside each existing biome instead of expanding the map', () => {
    const random = createSeededRandom(hashSeed('readability-pack'))
    for (const biome of BIOMES) {
      const stamps = planBiomeProps(biome, random)
      expect(stamps.length).toBeGreaterThan(30)
      for (const stamp of stamps) {
        expect(WORLD_PROP_TEXTURES).toContain(stamp.texture)
        expect(stamp.x).toBeGreaterThan(biome.x)
        expect(stamp.x).toBeLessThan(biome.x + biome.width)
        expect(stamp.y).toBeGreaterThan(0)
        expect(stamp.y).toBeLessThan(3200)
      }
    }
  })

  it('gives each biome a distinct prop language', () => {
    const random = createSeededRandom(1)
    const woodland = new Set(planBiomeProps(BIOMES[0], random).map((stamp) => stamp.texture))
    const swamp = new Set(planBiomeProps(BIOMES[1], random).map((stamp) => stamp.texture))
    const ruins = new Set(planBiomeProps(BIOMES[2], random).map((stamp) => stamp.texture))
    expect(woodland.has('prop-tree')).toBe(true)
    expect(swamp.has('prop-pool')).toBe(true)
    expect(ruins.has('prop-pillar')).toBe(true)
    expect(woodland.has('prop-pillar')).toBe(false)
    expect(swamp.has('prop-tree')).toBe(false)
    expect(ruins.has('prop-pool')).toBe(false)
  })
})
