import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_VALLEY_LENGTH } from '../src/gloamwood-valley-terrain'
import {
  GLOAMWOOD_VALLEY_RADAR_NORTH_UP,
  gloamwoodValleyRadarBranchEndpoints,
  gloamwoodValleyRadarBranchPaths,
  gloamwoodValleyRadarLocalMarker,
  gloamwoodValleyRadarLocalPoint,
  gloamwoodValleyRadarPointAt,
  gloamwoodValleyRadarRegionPath,
  gloamwoodValleyRadarRiverPath,
  gloamwoodValleyRadarRoutePath,
} from '../src/gloamwood-valley-radar'

describe('River Valley hunt radar geometry', () => {
  it('keeps the complete route inside the circular radar view', () => {
    for (let index = 0; index <= 36; index += 1) {
      const point = gloamwoodValleyRadarPointAt(GLOAMWOOD_VALLEY_LENGTH * index / 36)
      expect(point.x).toBeGreaterThanOrEqual(12)
      expect(point.x).toBeLessThanOrEqual(88)
      expect(point.y).toBeGreaterThanOrEqual(12)
      expect(point.y).toBeLessThanOrEqual(88)
    }
  })

  it('draws one continuous route instead of exposing individual creature markers', () => {
    const path = gloamwoodValleyRadarRoutePath()

    expect(path).toMatch(/^M[\d.]+ [\d.]+ L/)
    expect((path.match(/L/g) ?? []).length).toBeGreaterThan(60)
  })

  it('adds only geographic context: three valley regions and the real river', () => {
    expect(gloamwoodValleyRadarRegionPath('shallows')).toMatch(/^M/)
    expect(gloamwoodValleyRadarRegionPath('gorge')).toMatch(/^M/)
    expect(gloamwoodValleyRadarRegionPath('headwater')).toMatch(/^M/)
    expect(gloamwoodValleyRadarRiverPath()).toMatch(/^M/)
    expect(gloamwoodValleyRadarRiverPath()).not.toBe(gloamwoodValleyRadarRoutePath())
    expect(gloamwoodValleyRadarBranchPaths()).toHaveLength(6)
    expect(gloamwoodValleyRadarBranchPaths().every((path) => path.startsWith('M'))).toBe(true)
    expect(gloamwoodValleyRadarBranchEndpoints()).toHaveLength(6)
  })

  it('projects the selected map bearing around a centred player', () => {
    const viewport = { x: 100, z: 200, facingRadians: 0 }
    const centre = gloamwoodValleyRadarLocalPoint(100, 200, viewport)
    const ahead = gloamwoodValleyRadarLocalPoint(120, 200, viewport)
    const right = gloamwoodValleyRadarLocalPoint(100, 220, viewport)

    expect(centre).toEqual({ x: 50, y: 50 })
    expect(ahead.y).toBeLessThan(centre.y)
    expect(right.x).toBeGreaterThan(centre.x)
  })

  it('supports a stable north-up frame while the player arrow supplies facing', () => {
    const northUp = { x: 100, z: 200, facingRadians: GLOAMWOOD_VALLEY_RADAR_NORTH_UP }
    const routePoint = gloamwoodValleyRadarLocalPoint(120, 200, northUp)

    expect(GLOAMWOOD_VALLEY_RADAR_NORTH_UP).toBe(0)
    expect(routePoint.y).toBeLessThan(50)
  })

  it('keeps a distant key opportunity visible at the radar edge', () => {
    const marker = gloamwoodValleyRadarLocalMarker(900, 200, { x: 100, z: 200, facingRadians: 0 })

    expect(marker.offscreen).toBe(true)
    expect(marker.x).toBeCloseTo(50)
    expect(marker.y).toBeCloseTo(11)
  })
})
