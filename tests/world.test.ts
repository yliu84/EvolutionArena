import { describe, expect, it } from 'vitest'
import {
  BIOMES,
  ENCOUNTERS,
  FOG_CELL_SIZE,
  LANDMARKS,
  START_POSITION,
  VISION_RADIUS,
  TARGET_LOCK_RADIUS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  createFogGrid,
  getBiomeAt,
  revealFogCells,
  worldScreenArea,
} from '../src/world'

describe('exploration world', () => {
  it('provides a large bounded map rather than a single arena', () => {
    expect(worldScreenArea()).toBeGreaterThanOrEqual(18)
    expect(START_POSITION.x).toBeLessThan(WORLD_WIDTH)
    expect(START_POSITION.y).toBeLessThan(WORLD_HEIGHT)
  })

  it('defines three contiguous exploration biomes', () => {
    expect(BIOMES.map((biome) => biome.id)).toEqual(['gloamwood', 'rotfen', 'ashen-ruins'])
    expect(BIOMES[0].x).toBe(0)
    expect(BIOMES[0].width + BIOMES[1].width + BIOMES[2].width).toBe(WORLD_WIDTH)
    expect(getBiomeAt(START_POSITION.x, START_POSITION.y).id).toBe('gloamwood')
    expect(getBiomeAt(WORLD_WIDTH - 1, WORLD_HEIGHT / 2).id).toBe('ashen-ruins')
  })

  it('uses a rising encounter count and mixed rosters in dangerous regions', () => {
    expect(ENCOUNTERS).toHaveLength(27)
    for (const encounter of ENCOUNTERS) {
      const biome = getBiomeAt(encounter.x, encounter.y)
      expect(biome.id).toBe(encounter.biome)
    }
    const counts = BIOMES.map((biome) => ENCOUNTERS.filter((encounter) => encounter.biome === biome.id).length)
    expect(counts).toEqual([8, 9, 10])
    expect(new Set(ENCOUNTERS.filter((encounter) => encounter.biome === 'gloamwood').map((encounter) => encounter.monsterType)).size).toBe(8)
    expect(new Set(ENCOUNTERS.filter((encounter) => encounter.biome === 'rotfen').map((encounter) => encounter.monsterType)).size).toBe(9)
    expect(new Set(ENCOUNTERS.filter((encounter) => encounter.biome === 'ashen-ruins').map((encounter) => encounter.monsterType)).size).toBe(10)
    expect(new Set(ENCOUNTERS.map((encounter) => encounter.monsterType)).size).toBe(24)
  })

  it('keeps landmarks in bounds and includes a distant boss lair', () => {
    expect(LANDMARKS.some((landmark) => landmark.kind === 'boss-lair')).toBe(true)
    for (const landmark of LANDMARKS) {
      expect(landmark.x).toBeGreaterThan(0)
      expect(landmark.x).toBeLessThan(WORLD_WIDTH)
      expect(landmark.y).toBeGreaterThan(0)
      expect(landmark.y).toBeLessThan(WORLD_HEIGHT)
      expect(getBiomeAt(landmark.x, landmark.y).id).toBe(landmark.biome)
    }
  })

  it('reveals only nearby fog cells and preserves explored state', () => {
    const cells = createFogGrid()
    const expectedCount = Math.ceil(WORLD_WIDTH / FOG_CELL_SIZE) * Math.ceil(WORLD_HEIGHT / FOG_CELL_SIZE)
    expect(cells).toHaveLength(expectedCount)
    const firstReveal = revealFogCells(cells, START_POSITION.x, START_POSITION.y, VISION_RADIUS)
    const repeatedReveal = revealFogCells(cells, START_POSITION.x, START_POSITION.y, VISION_RADIUS)
    expect(firstReveal).toBeGreaterThan(20)
    expect(firstReveal).toBeLessThan(cells.length / 10)
    expect(repeatedReveal).toBe(0)
  })

  it('keeps fog visibility separate from ordinary target locking', () => {
    expect(VISION_RADIUS).toBeGreaterThan(TARGET_LOCK_RADIUS)
  })
})
