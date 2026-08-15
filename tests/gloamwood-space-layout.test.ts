import { describe, expect, it } from 'vitest'
import {
  GLOAMWOOD_SPACE_LAYOUT,
  areaScaleFromPrevious,
  combatSpaceDiameterRequired,
  isGloamwoodSpaceLabRequested,
  pointInsideSpaceZone,
  screenAreaCount,
  zoneById,
} from '../src/gloamwood-space-layout'

describe('Gloamwood spacious layout', () => {
  it('uses a separate maplab=3 entry point', () => {
    expect(isGloamwoodSpaceLabRequested('?maplab=3')).toBe(true)
    expect(isGloamwoodSpaceLabRequested('?maplab=3&debug=1')).toBe(true)
    expect(isGloamwoodSpaceLabRequested('?maplab=2')).toBe(false)
  })

  it('expands the previous slice into a multi-screen exploration space', () => {
    expect(GLOAMWOOD_SPACE_LAYOUT.world).toEqual({ width: 3600, height: 2200 })
    expect(GLOAMWOOD_SPACE_LAYOUT.groundAsset.path).toBe('assets/map-lab-v3/gloamwood-spacious-ground-v1.png')
    expect(GLOAMWOOD_SPACE_LAYOUT.groundAsset.sourceWidth / GLOAMWOOD_SPACE_LAYOUT.groundAsset.sourceHeight)
      .toBeCloseTo(GLOAMWOOD_SPACE_LAYOUT.world.width / GLOAMWOOD_SPACE_LAYOUT.world.height, 2)
    expect(areaScaleFromPrevious()).toBeGreaterThan(5)
    expect(screenAreaCount(1455, 818)).toBeGreaterThan(6)
  })

  it('keeps every main corridor broad enough for combat movement', () => {
    expect(Math.min(...GLOAMWOOD_SPACE_LAYOUT.corridors.map((corridor) => corridor.width)))
      .toBeGreaterThanOrEqual(GLOAMWOOD_SPACE_LAYOUT.minimumCorridorWidth)
    for (const corridor of GLOAMWOOD_SPACE_LAYOUT.corridors) {
      expect(zoneById(corridor.from)).toBeDefined()
      expect(zoneById(corridor.to)).toBeDefined()
    }
  })

  it('gives all main combat zones room for the longest basic attack and repositioning', () => {
    const requiredDiameter = combatSpaceDiameterRequired(GLOAMWOOD_SPACE_LAYOUT.magicRange)
    const combatZones = GLOAMWOOD_SPACE_LAYOUT.zones.filter((zone) => zone.kind !== 'spawn')
    expect(requiredDiameter).toBe(940)
    for (const zone of combatZones) {
      expect(Math.min(zone.width, zone.height)).toBeGreaterThanOrEqual(requiredDiameter)
      expect(pointInsideSpaceZone(zone.x, zone.y, zone)).toBe(true)
    }
  })

  it('keeps all clearings within the new world bounds', () => {
    for (const zone of GLOAMWOOD_SPACE_LAYOUT.zones) {
      expect(zone.x - zone.width / 2).toBeGreaterThanOrEqual(0)
      expect(zone.y - zone.height / 2).toBeGreaterThanOrEqual(0)
      expect(zone.x + zone.width / 2).toBeLessThanOrEqual(GLOAMWOOD_SPACE_LAYOUT.world.width)
      expect(zone.y + zone.height / 2).toBeLessThanOrEqual(GLOAMWOOD_SPACE_LAYOUT.world.height)
    }
  })
})
