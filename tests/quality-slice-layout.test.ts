import { describe, expect, it } from 'vitest'
import { QUALITY_SLICE, pointInsideQualityBlocker, qualitySlicePlayerRoadRatio, qualitySliceScale } from '../src/quality-slice-layout'

describe('quality slice proportions and topology', () => {
  it('keeps the generated map close to native resolution', () => {
    const scale = qualitySliceScale()
    expect(scale.x).toBeLessThanOrEqual(1.2)
    expect(scale.y).toBeLessThanOrEqual(1.2)
  })

  it('keeps the juvenile drake readable without dominating the road', () => {
    expect(QUALITY_SLICE.player.visualHeight / 720).toBeGreaterThanOrEqual(0.15)
    expect(QUALITY_SLICE.player.visualHeight / 720).toBeLessThanOrEqual(0.17)
    expect(qualitySlicePlayerRoadRatio()).toBeGreaterThanOrEqual(5.4)
  })

  it('anchors the animated sprite near the feet instead of its canvas centre', () => {
    expect(QUALITY_SLICE.player.groundOriginY).toBeGreaterThanOrEqual(0.76)
    expect(QUALITY_SLICE.player.groundOriginY).toBeLessThanOrEqual(0.82)
    expect(QUALITY_SLICE.player.frameDisplayHeight).toBeGreaterThan(QUALITY_SLICE.player.visualHeight)
  })

  it('makes the visible cliff, forest and water boundaries physical', () => {
    expect(new Set(QUALITY_SLICE.blockers.map((blocker) => blocker.kind))).toEqual(new Set(['cliff', 'forest', 'water']))
    for (const blocker of QUALITY_SLICE.blockers) {
      expect(pointInsideQualityBlocker(blocker.x, blocker.y, blocker)).toBe(true)
      expect(pointInsideQualityBlocker(blocker.x + blocker.width, blocker.y, blocker)).toBe(false)
    }
  })
})
