import { describe, expect, it } from 'vitest'
import { MAP_LAB_V2, isMapLabV2Requested } from '../src/map-lab-v2-config'

describe('Map Lab V2 layer gates', () => {
  it('uses a separate maplab=2 entry point', () => {
    expect(isMapLabV2Requested('?maplab=2')).toBe(true)
    expect(isMapLabV2Requested('?maplab=1')).toBe(false)
    expect(isMapLabV2Requested('?maplab=2&debug=1')).toBe(true)
  })

  it('declares the six approval-gate candidates as isolated comparable stages', () => {
    expect(MAP_LAB_V2.initialStage).toBe('atmosphere')
    expect(MAP_LAB_V2.language).toBe('dark-readable-2.5d')
    expect(MAP_LAB_V2.stages.ground.assetPath).toContain('map-lab-v2/gloamwood-ground-v1.png')
    expect(MAP_LAB_V2.stages.elevation.assetPath).toContain('map-lab-v2/gloamwood-elevation-v1.png')
    expect(MAP_LAB_V2.stages.riverbanks.assetPath).toContain('map-lab-v2/gloamwood-riverbanks-v1.png')
    expect(MAP_LAB_V2.stages.trees.assetPath).toContain('map-lab-v2/gloamwood-trees-v1.png')
    expect(MAP_LAB_V2.stages.landmarks.assetPath).toContain('map-lab-v2/gloamwood-landmarks-v1.png')
    expect(MAP_LAB_V2.stages.atmosphere.assetPath).toContain('map-lab-v2/gloamwood-atmosphere-v1.png')
    expect(Object.keys(MAP_LAB_V2.stages)).toEqual(['ground', 'elevation', 'riverbanks', 'trees', 'landmarks', 'atmosphere'])
  })
})
