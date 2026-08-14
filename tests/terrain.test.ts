import { describe, expect, it } from 'vitest'
import {
  GLOAMWOOD_RIVER,
  catmullRom,
  classifyGround,
  createGloamwoodLandscape,
  distToSegment,
  fbm,
  landscapeStats,
  riverDistance,
  riverWidth,
  sampleLandscape,
  splatWeights,
} from '../src/terrain'

describe('organic gloamwood ground', () => {
  it('uses continuous noise instead of a height-step grid', () => {
    const a = fbm(10.2, 8.4)
    const b = fbm(10.4, 8.4)
    expect(a).toBeGreaterThanOrEqual(0)
    expect(a).toBeLessThanOrEqual(1)
    expect(Math.abs(a - b)).toBeLessThan(0.35)
    expect(a).not.toBe(b)
  })

  it('keeps the river as a smooth path, not a tile trench', () => {
    const path = catmullRom(GLOAMWOOD_RIVER.map((point) => ({ x: point.x * 100, y: point.y * 100 })))
    expect(path.length).toBeGreaterThan(40)
    const onRiver = riverDistance(path[12].x, path[12].y, path)
    const far = riverDistance(0, 100, path)
    expect(onRiver).toBeLessThan(2)
    expect(far).toBeGreaterThan(onRiver + 10)
    expect(distToSegment(0, 0, 0, 0, 10, 0)).toBe(0)
    expect(riverWidth(400, 400)).toBeGreaterThan(40)
  })

  it('paints water, mud, dirt and grass on the same field', () => {
    expect(classifyGround(4, 0.01, 0.2, 30)).toBe('water')
    expect(classifyGround(70, 0.01, 0.2, 30)).toBe('grass')
    expect(classifyGround(34, 0.02, 0.2, 30)).toBe('mud')
    expect(classifyGround(80, 0.08, 0.8, 30)).toBe('dirt')
    const field = createGloamwoodLandscape(320, 220, 4)
    const mid = sampleLandscape(field, 160, 110)
    expect(mid.elevation).toBeGreaterThan(-0.5)
    expect(mid.light).toBeGreaterThan(0.3)
    const stats = landscapeStats(field)
    expect(stats.water).toBeGreaterThan(20)
    expect(stats.grass).toBeGreaterThan(20)
    expect(stats.dirt + stats.mud).toBeGreaterThan(10)
  })

  it('blends forest, dirt, mud and water without a tile grid', () => {
    const water = splatWeights(4, 0.01, 0.2, 30, 0.5)
    const forest = splatWeights(90, 0.01, 0.2, 30, 0.3)
    const dirt = splatWeights(90, 0.08, 0.8, 30, 0.2)
    expect(water.water).toBeGreaterThan(0.7)
    expect(forest.forest).toBeGreaterThan(0.4)
    expect(dirt.dirt).toBeGreaterThan(0.4)
    expect(water.water + water.mud + water.dirt + water.grass + water.forest).toBeCloseTo(1, 5)
  })
})
