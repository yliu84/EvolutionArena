import { describe, expect, it } from 'vitest'
import {
  GLOAMWOOD_HUNT_SLICE,
  GLOAMWOOD_SLICE_PROPS,
  GLOAMWOOD_SLICE_PROP_ASSETS,
  isGloamwoodHuntSliceRequested,
  pointInsideWorldRect,
  shouldFadeSliceProp,
  slicePropCollisionCenter,
} from '../src/gloamwood-hunt-slice'
import { createRunMap } from '../src/run-map'
import { ENCOUNTERS, START_POSITION, WORLD_HEIGHT, WORLD_WIDTH } from '../src/world'

describe('Gloamwood live-combat readability slice', () => {
  it('uses an explicit opt-in entry and keeps ordinary runs unchanged', () => {
    expect(isGloamwoodHuntSliceRequested('?huntlab=1&debug=1')).toBe(true)
    expect(isGloamwoodHuntSliceRequested('?maplab=2')).toBe(false)
    expect(isGloamwoodHuntSliceRequested('?starter=spine-stalker')).toBe(false)
  })

  it('covers the real player start and three existing Gloamwood encounters', () => {
    const region = GLOAMWOOD_HUNT_SLICE.region
    expect(region.x + region.width).toBeLessThanOrEqual(WORLD_WIDTH)
    expect(region.y + region.height).toBeLessThanOrEqual(WORLD_HEIGHT)
    expect(pointInsideWorldRect(START_POSITION.x, START_POSITION.y, region)).toBe(true)
    const covered = ENCOUNTERS.filter((encounter) => pointInsideWorldRect(encounter.x, encounter.y, region))
      .map((encounter) => encounter.id)
    expect(covered).toEqual([...GLOAMWOOD_HUNT_SLICE.expectedEncounterIds])
    const validationMap = createRunMap(GLOAMWOOD_HUNT_SLICE.validationSeed)
    expect(validationMap.layoutId).toBe('central-road')
    expect(validationMap.encounters.filter((encounter) => pointInsideWorldRect(encounter.x, encounter.y, region))
      .map((encounter) => encounter.id)).toEqual([...GLOAMWOOD_HUNT_SLICE.expectedEncounterIds])
  })

  it('uses the accepted sixth-layer atmosphere asset', () => {
    expect(GLOAMWOOD_HUNT_SLICE.assetPath).toBe('assets/map-lab-v2/gloamwood-atmosphere-v1.png')
    expect(GLOAMWOOD_HUNT_SLICE.purpose).toBe('live-combat-readability')
  })

  it('keeps foreground props inside the slice with trunk-sized collision bodies', () => {
    const ids = new Set<string>()
    for (const prop of GLOAMWOOD_SLICE_PROPS) {
      expect(ids.has(prop.id)).toBe(false)
      ids.add(prop.id)
      expect(pointInsideWorldRect(prop.x, prop.y, GLOAMWOOD_HUNT_SLICE.region)).toBe(true)
      expect(prop.collisionWidth).toBeLessThan(prop.displayHeight * 0.3)
      expect(prop.collisionHeight).toBeLessThan(prop.displayHeight * 0.3)
      expect(slicePropCollisionCenter(prop).y).toBeLessThan(prop.y)
      expect(GLOAMWOOD_SLICE_PROP_ASSETS[prop.kind].assetPath).toContain('assets/hunt-slice/')
    }
  })

  it('fades a canopy only while the player is close behind its anchor', () => {
    const prop = GLOAMWOOD_SLICE_PROPS[0]
    expect(shouldFadeSliceProp(prop.x, prop.y - 80, prop)).toBe(true)
    expect(shouldFadeSliceProp(prop.x, prop.y + 20, prop)).toBe(false)
    expect(shouldFadeSliceProp(prop.x + prop.fadeRadiusX + 1, prop.y - 80, prop)).toBe(false)
    expect(shouldFadeSliceProp(prop.x, prop.y - prop.fadeDepth - 1, prop)).toBe(false)
  })
})
